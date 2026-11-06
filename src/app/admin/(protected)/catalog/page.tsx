import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Brand, Category } from "@/models";
import { AdminTaxonomy } from "@/components/admin-taxonomy";
export const dynamic="force-dynamic";
export default async function CatalogAdminPage(){try{await requireAdmin(["product_manager","admin"]);}catch{redirect("/admin/dashboard");}let categories:Parameters<typeof AdminTaxonomy>[0]["categories"]=[],brands:Parameters<typeof AdminTaxonomy>[0]["brands"]=[];let unavailable=false;try{await connectDb();const[categoryDocs,brandDocs]=await Promise.all([Category.find().sort({name:1}).lean(),Brand.find().sort({name:1}).lean()]);categories=JSON.parse(JSON.stringify(categoryDocs));brands=JSON.parse(JSON.stringify(brandDocs));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">CATALOG STRUCTURE</p><h1>Categories & brands</h1><p>Organize the products shoppers browse.</p></div></div>{unavailable?<div className="admin-alert">Catalog records are unavailable.</div>:<AdminTaxonomy categories={categories} brands={brands}/>}</main>}
