import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, InventoryTransaction, Order, Product, ReturnRequest } from "@/models";

export async function GET() {
  try {
    await requireAdmin(["order_manager", "customer_support", "admin"], ["orders:read", "returns:read", "returns:manage"]);
    await connectDb();
    const returns = await ReturnRequest.find().populate("user", "name email").populate("order", "orderNumber status total").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ returns });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "You don’t have permission." : "Return requests unavailable." }, { status: forbidden ? 403 : 503 });
  }
}

const schema = z.object({ returnId: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["approved", "rejected", "received"]), adminNote: z.string().max(500).optional() });

export async function PATCH(request: Request) {
  let actor;
  try { actor = await requireAdmin(["order_manager", "customer_support", "admin"], ["orders:manage", "returns:manage"]); }
  catch { return NextResponse.json({ error: "You don’t have permission to manage returns." }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid return update." }, { status: 400 });
  const db = await mongoose.startSession();
  try {
    await connectDb();
    let failure = "";
    await db.withTransaction(async () => {
      const ret = await ReturnRequest.findById(parsed.data.returnId).session(db);
      if (!ret) { failure = "NOT_FOUND"; return; }
      const order = await Order.findById(ret.order).session(db);
      if (!order) { failure = "ORDER_NOT_FOUND"; return; }
      if (ret.status === "requested" && parsed.data.status === "approved") {
        if (order.status !== "return_requested") { failure = "ORDER_STATE"; return; }
      } else if (ret.status === "requested" && parsed.data.status === "rejected") {
        if (order.status !== "return_requested") { failure = "ORDER_STATE"; return; }
        order.status = "delivered";
        order.statusHistory.push({ status: "delivered", note: parsed.data.adminNote || "Return request rejected; order remains delivered", by: actor.name, at: new Date() });
        await order.save({ session: db });
      } else if (ret.status === "approved" && parsed.data.status === "received") {
        if (order.status !== "return_requested" || order.stockRestored) { failure = "ORDER_STATE"; return; }
        for (const item of order.items) {
          const product = await Product.findById(item.product).session(db);
          const variant = product?.variants.id(item.variantId);
          if (!product || !variant) { failure = "INVENTORY_ITEM_MISSING"; return; }
          variant.stock += item.quantity;
          await product.save({ session: db });
          await InventoryTransaction.create([{ product: product._id, variantId: variant._id, sku: variant.sku, delta: item.quantity, reason: "customer_return", actor: actor.id, order: order._id }], { session: db });
        }
        order.stockRestored = true;
        order.status = "returned";
        order.statusHistory.push({ status: "returned", note: "Approved return received; inventory restored", by: actor.name, at: new Date() });
        await order.save({ session: db });
      } else { failure = "INVALID"; return; }
      const previous = ret.status;
      ret.status = parsed.data.status;
      ret.adminNote = parsed.data.adminNote;
      await ret.save({ session: db });
      await AdminActivityLog.create([{ actor: actor.id, actorName: actor.name, action: "return.updated", entity: "ReturnRequest", entityId: ret.id, changes: { from: previous, to: parsed.data.status, note: parsed.data.adminNote } }], { session: db });
    });
    if (failure === "NOT_FOUND") return NextResponse.json({ error: "Return request not found." }, { status: 404 });
    if (failure === "ORDER_NOT_FOUND") return NextResponse.json({ error: "The original order was not found." }, { status: 404 });
    if (failure === "INVALID") return NextResponse.json({ error: "That return state change is not allowed." }, { status: 409 });
    if (failure === "ORDER_STATE") return NextResponse.json({ error: "The order state no longer matches this return request." }, { status: 409 });
    if (failure === "INVENTORY_ITEM_MISSING") return NextResponse.json({ error: "A returned item no longer matches inventory. Resolve it before marking the return received." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Return processing failed", error);
    return NextResponse.json({ error: "Unable to process return." }, { status: 503 });
  } finally { await db.endSession(); }
}
