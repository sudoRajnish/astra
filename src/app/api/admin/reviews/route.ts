import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, Product, Review } from "@/models";

const moderationSchema = z.object({ reviewId: z.string().regex(/^[a-f\d]{24}$/i), approved: z.boolean(), remove: z.boolean().optional() });

export async function GET() {
  try {
    await requireAdmin(["customer_support", "admin"], "reviews:moderate");
    await connectDb();
    const reviews = await Review.find().populate("user", "name email").populate("product", "name slug").sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ reviews });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "You don’t have permission to moderate reviews." : "Reviews unavailable." }, { status: forbidden ? 403 : 503 });
  }
}

export async function PATCH(request: Request) {
  let actor;
  try { actor = await requireAdmin(["customer_support", "admin"], "reviews:moderate"); }
  catch { return NextResponse.json({ error: "You don’t have permission to moderate reviews." }, { status: 403 }); }
  const parsed = moderationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review change." }, { status: 400 });
  try {
    await connectDb();
    const review = await Review.findById(parsed.data.reviewId);
    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    const productId = review.product;
    const priorApproved = review.approved;
    if (parsed.data.remove) await review.deleteOne();
    else { review.approved = parsed.data.approved; await review.save(); }

    const [stats] = await Review.aggregate([{ $match: { product: productId, approved: true } }, { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    await Product.updateOne({ _id: productId }, { $set: { rating: stats?.rating || 0, reviewCount: stats?.count || 0 } });
    await AdminActivityLog.create({ actor: actor.id, actorName: actor.name, action: parsed.data.remove ? "review.deleted" : "review.moderated", entity: "Review", entityId: review.id, changes: { from: priorApproved, to: parsed.data.remove ? "removed" : parsed.data.approved } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Review moderation failed", error);
    return NextResponse.json({ error: "Unable to update review." }, { status: 503 });
  }
}
