import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { connectDb } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth";
import { Coupon, InventoryTransaction, Order, Product, User, WebsiteSetting } from "@/models";

const input = z.object({ items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), variantId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(10) })).min(1).max(20), paymentMethod: z.enum(["cod", "razorpay"]), address: z.object({ name: z.string().min(2).max(100), phone: z.string().regex(/^[6-9]\d{9}$/), line1: z.string().min(3).max(200), line2: z.string().max(200).optional(), city: z.string().min(2).max(100), state: z.string().min(2).max(100), pincode: z.string().regex(/^\d{6}$/) }), coupon: z.string().max(40).optional() });

export async function POST(request: Request) {
  const sessionUser = await getCustomerSession();
  if (!sessionUser) return NextResponse.json({ error: "Please sign in before placing an order." }, { status: 401 });
  try { if (!(await rateLimit(request, "checkout", 5, 15 * 60 * 1000))) return NextResponse.json({ error: "Too many checkout attempts. Please wait and try again." }, { status: 429 }); }
  catch { return NextResponse.json({ error: "Checkout is unavailable." }, { status: 503 }); }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid order details." }, { status: 400 });
  const idempotencyKey = request.headers.get("Idempotency-Key") || randomUUID();
  try {
    await connectDb();
    const user = await User.findById(sessionUser.id).select("active");
    if (!user?.active) return NextResponse.json({ error: "This account is not active." }, { status: 403 });
    const existing = await Order.findOne({ idempotencyKey, user: sessionUser.id }).lean();
    if (existing) return NextResponse.json({ order: { id: String(existing._id), orderNumber: existing.orderNumber, total: existing.total, status: existing.status }, ...(existing.paymentMethod === "razorpay" && existing.razorpayOrderId && process.env.RAZORPAY_KEY_ID ? { payment: { providerOrderId: existing.razorpayOrderId, keyId: process.env.RAZORPAY_KEY_ID, amount: Math.round(existing.total * 100), currency: "INR" } } : {}) });
    const configDocs = await WebsiteSetting.find({ key: { $in: ["codEnabled", "shippingFee", "freeShippingThreshold"] } }).lean();
    const config = Object.fromEntries(configDocs.map((doc) => [doc.key, doc.value]));
    const codEnabled = typeof config.codEnabled === "boolean" ? config.codEnabled : process.env.ENABLE_COD !== "false";
    if (parsed.data.paymentMethod === "cod" && !codEnabled) return NextResponse.json({ error: "Cash on delivery is currently unavailable." }, { status: 400 });
    let subtotal = 0;
    const resolved: { product: typeof Product.prototype; variantId: mongoose.Types.ObjectId; sku: string; color: string; ram: string; storage: string; image: string; price: number; quantity: number; name: string; slug: string }[] = [];
    for (const line of parsed.data.items) {
      const product = await Product.findOne({ _id: line.productId, published: true });
      if (!product) return NextResponse.json({ error: "A product in your bag is no longer available." }, { status: 409 });
      const variant = product.variants.id(line.variantId);
      if (!variant || variant.stock < line.quantity) return NextResponse.json({ error: `${product.name} no longer has enough stock.` }, { status: 409 });
      subtotal += variant.price * line.quantity;
      resolved.push({ product, variantId: variant._id, sku: variant.sku, color: variant.color, ram: variant.ram, storage: variant.storage, image: variant.image || product.images[0] || "", price: variant.price, quantity: line.quantity, name: product.name, slug: product.slug });
    }
    let discount = 0; let couponCode: string | undefined;
    if (parsed.data.coupon) {
      const coupon = await Coupon.findOne({ code: parsed.data.coupon.toUpperCase(), active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });
      const customerUseCount = coupon ? await Order.countDocuments({ user: sessionUser.id, couponCode: coupon.code }) : 0;
      const isFirstOrder = coupon?.firstOrderOnly ? !(await Order.exists({ user: sessionUser.id })) : true;
      const productMatch = coupon && (!coupon.productIds.length || resolved.every((line) => coupon.productIds.some((id: unknown) => String(id) === String(line.product._id))));
      const categoryMatch = coupon && (!coupon.categories.length || resolved.every((line) => coupon.categories.includes(line.product.category)));
      const brandMatch = coupon && (!coupon.brands.length || resolved.every((line) => coupon.brands.includes(line.product.brand)));
      if (!coupon || subtotal < coupon.minOrder || (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) || customerUseCount >= (coupon.perCustomerLimit || 1) || !isFirstOrder || !productMatch || !categoryMatch || !brandMatch) return NextResponse.json({ error: "This coupon is invalid or no longer available for this order." }, { status: 400 });
      discount = coupon.type === "percentage" ? Math.min(subtotal * coupon.value / 100, coupon.maxDiscount ?? subtotal) : Math.min(coupon.value, subtotal);
      couponCode = coupon.code;
    }
    const freeShippingAt = Number(config.freeShippingThreshold ?? process.env.FREE_SHIPPING_THRESHOLD ?? 25000);
    const shipping = subtotal - discount >= freeShippingAt ? 0 : Number(config.shippingFee ?? process.env.SHIPPING_FEE ?? 199);
    const total = Math.max(0, subtotal - discount + shipping);
    const orderNumber = `AST-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    let razorpayOrderId: string | undefined;
    if (parsed.data.paymentMethod === "razorpay") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "Online payment is not configured for this store." }, { status: 503 });
      try {
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const paymentOrder = await razorpay.orders.create({ amount: Math.round(total * 100), currency: "INR", receipt: orderNumber });
        razorpayOrderId = paymentOrder.id;
      } catch (error) { console.error("Razorpay order creation failed", error); return NextResponse.json({ error: "Online payment could not be started." }, { status: 503 }); }
    }
    const dbSession = await mongoose.startSession();
    let created: { _id: mongoose.Types.ObjectId; orderNumber: string; total: number; status: string } | null = null;
    try {
      await dbSession.withTransaction(async () => {
        for (const line of resolved) {
          const product = await Product.findById(line.product._id).session(dbSession);
          const variant = product?.variants.id(line.variantId);
          if (!product || !variant || variant.stock < line.quantity) throw new Error("STOCK_CHANGED");
          variant.stock -= line.quantity;
          await product.save({ session: dbSession });
          await InventoryTransaction.create([{ product: product._id, variantId: variant._id, sku: variant.sku, delta: -line.quantity, reason: "order_placed", actor: sessionUser.id }], { session: dbSession });
        }
        if (couponCode) {
          const updated = await Coupon.updateOne({ code: couponCode, active: true, ...(typeof (await Coupon.findOne({ code: couponCode }).select("usageLimit").lean())?.usageLimit === "number" ? { $expr: { $lt: ["$usedCount", "$usageLimit"] } } : {}) }, { $inc: { usedCount: 1 } }, { session: dbSession });
          if (!updated.modifiedCount) throw new Error("COUPON_CHANGED");
        }
        const [order] = await Order.create([{
          orderNumber, idempotencyKey, user: sessionUser.id,
          items: resolved.map((line) => ({ product: line.product._id, name: line.name, slug: line.slug, sku: line.sku, variantId: line.variantId, color: line.color, ram: line.ram, storage: line.storage, image: line.image, price: line.price, quantity: line.quantity })),
          shippingAddress: parsed.data.address, subtotal, shipping, discount, couponCode, total,
          paymentMethod: parsed.data.paymentMethod, paymentStatus: "pending", razorpayOrderId, status: "pending", statusHistory: [{ status: "pending", note: "Order created" }],
        }], { session: dbSession });
        if (parsed.data.paymentMethod === "razorpay") await import("@/models").then(({ Payment }) => Payment.create([{ order: order._id, provider: "razorpay", providerOrderId: razorpayOrderId, amount: total, currency: "INR", status: "created" }], { session: dbSession }));
        created = { _id: order._id, orderNumber, total, status: order.status };
      });
    } finally { await dbSession.endSession(); }
    return NextResponse.json({ order: { id: String(created!._id), orderNumber: created!.orderNumber, total: created!.total, status: created!.status }, ...(razorpayOrderId ? { payment: { providerOrderId: razorpayOrderId, keyId: process.env.RAZORPAY_KEY_ID, amount: Math.round(total * 100), currency: "INR" } } : {}) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") return NextResponse.json({ error: "Stock changed while you were checking out. Please review your bag." }, { status: 409 });
    if (error instanceof Error && error.message === "COUPON_CHANGED") return NextResponse.json({ error: "This coupon has just reached its usage limit." }, { status: 409 });
    if (error instanceof Error && error.message.includes("Transaction numbers are only allowed")) return NextResponse.json({ error: "The store database must support MongoDB transactions before checkout can be enabled." }, { status: 503 });
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "We could not place your order. Please try again." }, { status: 503 });
  }
}
