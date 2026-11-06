import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Product } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { AdminProducts, type AdminProduct } from "@/components/admin-products";

export const dynamic="force-dynamic";
export default async function AdminProductsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  try{await requireAdmin(["product_manager","admin"]);}catch{redirect("/admin/dashboard");}
  let products: AdminProduct[]=[];let unavailable=false;
  try{await connectDb();const q=(await searchParams).q?.trim();const filter=q?{$or:[{name:new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i")},{brand:new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i")},{"variants.sku":q}]}:{};const docs=await Product.find(filter).select("name slug brand category description images specifications featured bestseller published variants").sort({createdAt:-1}).limit(100).lean();products=JSON.parse(JSON.stringify(docs.map(product=>({...product,specifications:Object.fromEntries(product.specifications??[])}))));}catch{unavailable=true;}
  return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">CATALOG</p><h1>Products</h1><p>Manage your products, pricing and availability.</p></div></div>{unavailable?<div className="admin-alert">Product data is unavailable. Check the database connection.</div>:<AdminProducts products={products}/>}</main>;
}
