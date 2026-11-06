import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Product, Review } from "@/models";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDb();
    const { slug } = await params;
    const product = await Product.findOne({ slug, published: true }).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const reviews = await Review.find({ product: product._id, approved: true }).populate("user", "name").sort({ createdAt: -1 }).limit(20).lean();
    return NextResponse.json({ product, reviews });
  } catch (error) {
    console.error("Product detail failed", error);
    return NextResponse.json({ error: "Product is temporarily unavailable." }, { status: 503 });
  }
}
