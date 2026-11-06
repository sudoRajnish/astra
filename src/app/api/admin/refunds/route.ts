import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, Order, Payment, Refund } from "@/models";

const schema = z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i), amount: z.number().positive().optional(), manualReference: z.string().trim().min(3).max(100).optional(), reason: z.string().max(300).optional() });

export async function POST(request: Request) {
  let actor;
  try { actor = await requireAdmin(["admin", "order_manager"],"orders:manage"); }
  catch { return NextResponse.json({ error: "You don’t have permission to process refunds." }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid refund details." }, { status: 400 });

  let reservation: InstanceType<typeof Refund> | undefined;
  try {
    await connectDb();
    const order = await Order.findById(parsed.data.orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "refund_pending" || order.paymentStatus !== "paid") return NextResponse.json({ error: "Only verified paid orders awaiting refund can be refunded." }, { status: 409 });
    const amount = parsed.data.amount ?? order.total;
    if (Math.round(amount * 100) !== Math.round(order.total * 100)) return NextResponse.json({ error: "This workflow supports full order refunds only. The refund must equal the order total." }, { status: 400 });
    const existing = await Refund.findOne({ order: order._id }).lean();
    if (existing) return NextResponse.json({ error: "A refund has already been submitted for this order. Check its provider status before taking further action." }, { status: 409 });

    let payment;
    if (order.paymentMethod === "razorpay") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
      payment = await Payment.findOne({ order: order._id, status: "captured" });
      if (!payment?.transactionId) return NextResponse.json({ error: "No captured Razorpay transaction is linked to this order." }, { status: 409 });
    } else if (!parsed.data.manualReference) {
      return NextResponse.json({ error: "Enter the verified manual refund reference for this cash-on-delivery order." }, { status: 400 });
    }

    // Reserve the single refund slot before calling the provider. The unique order index
    // prevents a second request racing this one and triggering a duplicate money movement.
    reservation = await Refund.create({ order: order._id, payment: payment?._id, amount, status: "pending", reason: parsed.data.reason || parsed.data.manualReference, processedBy: actor.name });
    let status: "processed" | "pending" = "processed";
    let providerRefundId = parsed.data.manualReference || "";
    if (payment?.transactionId) {
      const client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
      const result = await client.payments.refund(payment.transactionId, { amount: Math.round(amount * 100), notes: { orderNumber: order.orderNumber, reason: parsed.data.reason || "Customer refund" } });
      providerRefundId = result.id;
      status = result.status === "processed" ? "processed" : "pending";
    }

    reservation.providerRefundId = providerRefundId || undefined;
    reservation.status = status;
    await reservation.save();
    if (status === "processed") {
      if (payment) await Payment.updateOne({ _id: payment._id }, { $set: { status: "refunded" } });
      order.paymentStatus = "refunded";
      order.status = "refunded";
      order.statusHistory.push({ status: "refunded", note: `Full refund of ₹${amount} processed`, by: actor.name, at: new Date() });
      await order.save();
    }
    await AdminActivityLog.create({ actor: actor.id, actorName: actor.name, action: "refund.created", entity: "Refund", entityId: reservation.id, changes: { order: order.orderNumber, amount, status, providerRefundId } });
    return NextResponse.json({ ok: true, status, refundId: reservation.id });
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) return NextResponse.json({ error: "A refund has already been submitted for this order. Check its provider status before taking further action." }, { status: 409 });
    console.error("Refund processing failed", error);
    return NextResponse.json({ error: reservation ? "The refund request is reserved but its provider status is uncertain. Verify it in Razorpay before any further action." : "Refund could not be processed." }, { status: 503 });
  }
}
