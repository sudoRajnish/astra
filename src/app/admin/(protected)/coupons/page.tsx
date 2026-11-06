import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Coupon } from "@/models";
import { AdminCoupons } from "@/components/admin-coupons";
export const dynamic="force-dynamic";
export default async function CouponsPage(){try{await requireAdmin(["admin"]);}catch{redirect("/admin/dashboard");}let coupons:Parameters<typeof AdminCoupons>[0]["coupons"]=[];let unavailable=false;try{await connectDb();coupons=JSON.parse(JSON.stringify(await Coupon.find().sort({createdAt:-1}).lean()));}catch{unavailable=true;}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">PROMOTIONS</p><h1>Coupons</h1><p>Create and manage store discounts.</p></div></div>{unavailable?<div className="admin-alert">Coupons are unavailable.</div>:<AdminCoupons coupons={coupons}/>}</main>}
