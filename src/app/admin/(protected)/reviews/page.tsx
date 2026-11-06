import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Review } from "@/models";
import { AdminReviews } from "@/components/admin-reviews";
export const dynamic="force-dynamic";
export default async function ReviewsPage(){try{await requireAdmin(["customer_support","admin"]);}catch{redirect("/admin/dashboard");}let reviews:Parameters<typeof AdminReviews>[0]["reviews"]=[];try{await connectDb();reviews=JSON.parse(JSON.stringify(await Review.find().populate("user","name email").populate("product","name slug").sort({createdAt:-1}).limit(100).lean()));}catch{}return <main className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">CUSTOMER FEEDBACK</p><h1>Reviews</h1><p>Approve reviews from verified buyers before they appear on product pages.</p></div></div><AdminReviews reviews={reviews}/></main>}
