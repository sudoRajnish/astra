import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { WebsiteSetting } from "@/models";
import { AdminSettings } from "@/components/admin-settings";
export const dynamic="force-dynamic";
export default async function SettingsPage(){try{await requireAdmin(["admin"]);}catch{redirect("/admin/dashboard");}let initial:Record<string,unknown>={};let unavailable=false;try{await connectDb();const docs=await WebsiteSetting.find().lean();initial=Object.fromEntries(docs.map(d=>[d.key,d.value]));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">STORE CONFIGURATION</p><h1>Settings</h1><p>Manage store details, shipping behavior and SEO defaults.</p></div></div>{unavailable?<div className="admin-alert">Settings are unavailable.</div>:<AdminSettings initial={initial}/>}</main>}
