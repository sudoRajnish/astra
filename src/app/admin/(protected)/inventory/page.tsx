import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Product } from "@/models";
import { AdminInventory } from "@/components/admin-inventory";
export const dynamic="force-dynamic";
export default async function InventoryPage(){try{await requireAdmin(["inventory_manager","admin"]);}catch{redirect("/admin/dashboard");}let products:Parameters<typeof AdminInventory>[0]["products"]=[];let unavailable=false;try{await connectDb();products=JSON.parse(JSON.stringify(await Product.find().select("name brand variants.sku variants.color variants.ram variants.storage variants.stock").sort({name:1}).lean()));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">STOCK CONTROL</p><h1>Inventory</h1><p>Track variant-level stock and log every adjustment.</p></div></div>{unavailable?<div className="admin-alert">Inventory records are unavailable.</div>:<AdminInventory products={products}/>}</main>}
