import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Product } from "@/models";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export async function GET(request: Request) {
  try {
    await connectDb();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit")) || 12));
    const filters: Record<string, unknown> = { published: true };
    for (const field of ["brand", "category"] as const) {
      const value = url.searchParams.get(field);
      if (value) filters[field] = new RegExp(`^${escapeRegex(value)}$`, "i");
    }
    const q = url.searchParams.get("q")?.trim();
    if (q) filters.$text = { $search: q.slice(0, 100) };
    const sort = url.searchParams.get("sort");
    const sortBy: Record<string, 1 | -1> = sort === "price-asc" ? { "variants.price": 1 } : sort === "price-desc" ? { "variants.price": -1 } : sort === "popular" ? { bestseller: -1, rating: -1 } : { createdAt: -1 };
    const [products, total] = await Promise.all([
      Product.find(filters).select("name slug brand category images variants.price variants.mrp variants.stock featured bestseller rating reviewCount createdAt").sort(sortBy).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filters),
    ]);
    return NextResponse.json({ products, page, limit, total, pages: Math.ceil(total / limit) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Product list failed", error);
    return NextResponse.json({ error: "Product catalog is temporarily unavailable." }, { status: 503 });
  }
}
