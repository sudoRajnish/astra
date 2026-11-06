import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { ReturnRequest } from "@/models";
import { AdminReturns } from "@/components/admin-returns";
export const dynamic="force-dynamic";
export default async function ReturnsPage(){try{await requireAdmin(["order_manager","customer_support","admin"]);}catch{redirect("/admin/dashboard");}let requests:Parameters<typeof AdminReturns>[0]["requests"]=[];let unavailable=false;try{await connectDb();requests=JSON.parse(JSON.stringify(await ReturnRequest.find().populate("user","name email").populate("order","orderNumber status total").sort({createdAt:-1}).lean()));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">AFTERCARE</p><h1>Returns</h1><p>Review return requests and record returned inventory.</p></div></div>{unavailable?<div className="admin-alert">Return requests are unavailable.</div>:<AdminReturns requests={requests}/>}</main>}
