import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Order } from "@/models";
import { AdminOrders } from "@/components/admin-orders";
export const dynamic="force-dynamic";
export default async function AdminOrdersPage({searchParams}:{searchParams:Promise<{status?:string}>}){try{await requireAdmin(["order_manager","admin"]);}catch{redirect("/admin/dashboard");}let orders:Parameters<typeof AdminOrders>[0]["orders"]=[];let unavailable=false;try{await connectDb();const status=(await searchParams).status;const filter=status?{status}:{};orders=JSON.parse(JSON.stringify(await Order.find(filter).populate("user","name email").sort({createdAt:-1}).limit(100).lean()));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">FULFILLMENT</p><h1>Orders</h1><p>Track and update the status of every order.</p></div></div><form className="order-filters"><label>Status<select name="status" defaultValue=""><option value="">All orders</option>{["pending","confirmed","processing","shipped","delivered","cancelled","return_requested","returned","refund_pending","refunded"].map(status=><option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}</select></label><button className="admin-primary">Filter</button><Link href="/admin/orders">Clear</Link></form>{unavailable?<div className="admin-alert">Order data is unavailable. Check the database connection.</div>:<AdminOrders orders={orders}/>}</main>}
