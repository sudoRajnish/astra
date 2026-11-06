import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Order, User, Wishlist } from "@/models";
import { formatINR } from "@/lib/format";
import { AccountSettings } from "@/components/account-settings";

export const dynamic="force-dynamic";
export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export default async function AccountPage(){
  let session;try{session=await requireCustomer();}catch{redirect("/login");}
  let orders:{_id:string;orderNumber:string;status:string;total:number;createdAt:Date}[]=[],addresses:Parameters<typeof AccountSettings>[0]["addresses"]=[];let saved=0;
  try{await connectDb();const[user,orderRows,wishlistCount]=await Promise.all([User.findById(session.id).select("name addresses").lean(),Order.find({user:session.id}).select("orderNumber status total createdAt").sort({createdAt:-1}).limit(10).lean(),Wishlist.countDocuments({user:session.id})]);orders=JSON.parse(JSON.stringify(orderRows));addresses=JSON.parse(JSON.stringify(user?.addresses||[]));saved=wishlistCount;}catch{}
  return <main className="account-page content-section"><p className="eyebrow">YOUR ASTRA ACCOUNT</p><h1>Welcome, {session.name.split(" ")[0]}.</h1><p className="account-email">{session.email}</p><div className="account-tabs"><a href="#orders">Orders</a><a href="#profile">Profile & addresses</a><Link href="/account/wishlist">Wishlist ({saved})</Link></div>
    <section id="orders" className="account-section"><div className="account-section-head"><h2>Your orders</h2><span>{orders.length} recent</span></div>{orders.length?orders.map(order=><article className="account-order" key={order._id}><div><small>{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</small><b>{formatINR(order.total)}</b></div><span className={`status status-${order.status}`}>{order.status.replaceAll("_"," ")}</span><Link href={`/account/orders/${order._id}`}>View details →</Link></article>):<div className="empty-catalog">No orders yet. <Link className="text-link" href="/products">Explore the collection →</Link></div>}</section>
    <div id="profile"><AccountSettings name={session.name} addresses={addresses}/></div>
  </main>;
}
