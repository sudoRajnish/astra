import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Banner, HomepageSection } from "@/models";
import { AdminBanners } from "@/components/admin-banners";
import { AdminHomeSections } from "@/components/admin-home-sections";
export const dynamic="force-dynamic";
export default async function BannersPage(){try{await requireAdmin(["admin"]);}catch{redirect("/admin/dashboard");}let banners:Parameters<typeof AdminBanners>[0]["banners"]=[],sections:Parameters<typeof AdminHomeSections>[0]["initial"]=[];let unavailable=false;try{await connectDb();const[bannerDocs,sectionDocs]=await Promise.all([Banner.find().sort({order:1}).lean(),HomepageSection.find().sort({order:1}).lean()]);banners=JSON.parse(JSON.stringify(bannerDocs));sections=JSON.parse(JSON.stringify(sectionDocs));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">STOREFRONT</p><h1>Homepage manager</h1><p>Edit banners and control homepage section visibility.</p></div></div>{unavailable?<div className="admin-alert">Banner data unavailable.</div>:<><AdminHomeSections initial={sections}/><AdminBanners banners={banners}/></>}</main>}
