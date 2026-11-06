import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { CMSPage } from "@/models";
import { AdminContent } from "@/components/admin-content";
export const dynamic="force-dynamic";
export default async function ContentAdminPage(){try{await requireAdmin(["admin"]);}catch{redirect("/admin/dashboard");}let pages:Parameters<typeof AdminContent>[0]["pages"]=[];let unavailable=false;try{await connectDb();pages=JSON.parse(JSON.stringify(await CMSPage.find().sort({slug:1}).lean()));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">WEBSITE CONTENT</p><h1>CMS pages</h1><p>Edit public information pages and search metadata.</p></div></div>{unavailable?<div className="admin-alert">Content is unavailable.</div>:pages.length?<AdminContent pages={pages}/>:<div className="admin-empty">No CMS pages have been seeded. Run the seed command to create the editable starter pages.</div>}</main>}
