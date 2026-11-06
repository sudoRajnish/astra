import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, Order, Product } from "@/models";

const variant = z.object({ _id: z.string().regex(/^[a-f0-9]{24}$/i).optional(), sku: z.string().trim().min(2).max(80), color: z.string().trim().min(2).max(40), ram: z.string().trim().min(1).max(20), storage: z.string().trim().min(1).max(20), price: z.number().nonnegative(), mrp: z.number().nonnegative(), stock: z.number().int().nonnegative(), image: z.string().max(2048).optional() });
const productImage=z.union([z.string().url().max(2048),z.string().regex(/^\/images\/products\/[a-z0-9._-]+$/i)]);
const updateSchema = z.object({ published: z.boolean().optional(), featured: z.boolean().optional(), bestseller: z.boolean().optional(), name: z.string().trim().min(2).max(140).optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), brand: z.string().trim().min(1).max(60).optional(), category: z.string().trim().min(1).max(60).optional(), description: z.string().max(5000).optional(), images: z.array(productImage).max(8).optional(), variants: z.array(variant).min(1).max(30).optional(), specifications: z.record(z.string(), z.string().max(500)).optional() }).refine(data => !data.variants || data.variants.every(item => item.price <= item.mrp), "Variant price cannot exceed MRP.");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try { actor = await requireAdmin(["product_manager", "admin"], "catalog:manage"); }
  catch { return NextResponse.json({ error: "You don’t have permission to manage products." }, { status: 403 }); }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid product changes." }, { status: 400 });
  try {
    await connectDb();
    const { id } = await params;
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const before = { published: product.published, featured: product.featured, bestseller: product.bestseller, name: product.name, slug: product.slug, brand: product.brand, category: product.category, description: product.description, images: product.images, variants: JSON.parse(JSON.stringify(product.variants)) as unknown, specifications: Object.fromEntries(product.specifications) };
    if (parsed.data.variants) {
      const skus = parsed.data.variants.map(item => item.sku.toLowerCase());
      if (new Set(skus).size !== skus.length) return NextResponse.json({ error: "Each variant needs a unique SKU." }, { status: 400 });
      if (await Product.exists({ _id: { $ne: product._id }, "variants.sku": { $in: skus } })) return NextResponse.json({ error: "A SKU is already in use by another product." }, { status: 409 });
      const orders = await Order.find({ "items.product": product._id }).select("items.variantId").lean<{ items: { variantId: unknown }[] }[]>();
      const usedIds = new Set(orders.flatMap(order => order.items.map(item => String(item.variantId))));
      const submittedIds = new Set(parsed.data.variants.flatMap(item => item._id ? [item._id] : []));
      if ([...usedIds].some(variantId => !submittedIds.has(variantId))) return NextResponse.json({ error: "Keep variants used by past orders. You can set their stock to zero instead." }, { status: 409 });
      product.variants = parsed.data.variants.map(item => ({ ...item, _id: item._id || undefined }));
    }
    const specifications = parsed.data.specifications;
    const fields = Object.fromEntries(Object.entries(parsed.data).filter(([key]) => key !== "variants" && key !== "specifications"));
    Object.assign(product, fields);
    if (specifications) product.set("specifications", new Map(Object.entries(specifications)));
    if (parsed.data.published !== undefined) product.publishedAt = parsed.data.published ? new Date() : null;
    await product.save();
    await AdminActivityLog.create({ actor: actor.id, actorName: actor.name, action: "product.updated", entity: "Product", entityId: product.id, changes: { before, after: parsed.data } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) return NextResponse.json({ error: "The slug or SKU is already in use." }, { status: 409 });
    console.error("Product update failed", error);
    return NextResponse.json({ error: "Unable to update product." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try { actor = await requireAdmin(["product_manager", "admin"], "catalog:manage"); }
  catch { return NextResponse.json({ error: "You don’t have permission to manage products." }, { status: 403 }); }
  try {
    await connectDb();
    const { id } = await params;
    if (await Order.exists({ "items.product": id })) return NextResponse.json({ error: "This product appears in order history and cannot be deleted. Unpublish it instead." }, { status: 409 });
    const product = await Product.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    await AdminActivityLog.create({ actor: actor.id, actorName: actor.name, action: "product.deleted", entity: "Product", entityId: id, changes: { name: product.name, slug: product.slug } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product deletion failed", error);
    return NextResponse.json({ error: "Unable to update product." }, { status: 503 });
  }
}
