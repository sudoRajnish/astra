import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, Brand, Category, Product } from "@/models";

const schema = z.object({ type: z.enum(["category", "brand"]), active: z.boolean().optional(), name: z.string().trim().min(2).max(80).optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), description: z.string().max(1000).optional(), image: z.union([z.literal(""), z.url()]).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try { actor = await requireAdmin(["product_manager", "admin"], "catalog:manage"); }
  catch { return NextResponse.json({ error: "You don’t have permission." }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  try {
    await connectDb();
    const { id } = await params;
    const Model = parsed.data.type === "category" ? Category : Brand;
    const { type, ...changes } = parsed.data;
    const record = await Model.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
    if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    await AdminActivityLog.create({ actor: actor.id, actorName: actor.name, action: `${type}.updated`, entity: type, entityId: id, changes });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    console.error("Taxonomy update failed", error);
    return NextResponse.json({ error: "Unable to update record." }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try { actor = await requireAdmin(["product_manager", "admin"], "catalog:manage"); }
  catch { return NextResponse.json({ error: "You don’t have permission." }, { status: 403 }); }
  const type = new URL(request.url).searchParams.get("type");
  if (type !== "category" && type !== "brand") return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  try {
    await connectDb();
    const { id } = await params;
    const Model = type === "category" ? Category : Brand;
    const record = await Model.findById(id);
    if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    const linked = type === "category" ? await Product.exists({ category: record.name }) : await Product.exists({ brand: record.name });
    if (linked) return NextResponse.json({ error: "This record is in use by products. Deactivate it instead." }, { status: 409 });
    await record.deleteOne();
    await AdminActivityLog.create({ actor: actor.id, actorName: actor.name, action: `${type}.deleted`, entity: type, entityId: id, changes: { name: record.name } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Taxonomy deletion failed", error);
    return NextResponse.json({ error: "Unable to delete record." }, { status: 503 });
  }
}
