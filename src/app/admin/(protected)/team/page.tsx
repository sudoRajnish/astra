import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Role, User } from "@/models";
import { AdminTeam } from "@/components/admin-team";
export const dynamic="force-dynamic";
export default async function TeamPage(){try{await requireAdmin(["super_admin"]);}catch{redirect("/admin/dashboard");}let admins:Parameters<typeof AdminTeam>[0]["admins"]=[],roleList:Parameters<typeof AdminTeam>[0]["roleList"]=[];let unavailable=false;try{await connectDb();const[users,roles]=await Promise.all([User.find({role:{$ne:"customer"}}).select("name email role active createdAt").sort({createdAt:-1}).lean(),Role.find().select("key label permissions active").sort({label:1}).lean()]);admins=JSON.parse(JSON.stringify(users));roleList=JSON.parse(JSON.stringify(roles));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">ACCESS CONTROL</p><h1>Admin team</h1><p>Manage administrator accounts and role permissions.</p></div></div>{unavailable?<div className="admin-alert">Admin records are unavailable. Seed role definitions first.</div>:<AdminTeam admins={admins} roleList={roleList}/>}</main>}
