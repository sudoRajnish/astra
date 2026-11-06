import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Order } from "@/models";
import { formatINR } from "@/lib/format";
import { OrderActions } from "@/components/order-actions";
export const metadata = { title: "Order details", robots: { index: false, follow: false } };
export const dynamic="force-dynamic";
type OrderView={_id:string;orderNumber:string;status:string;createdAt:string;total:number;items:{sku:string;image?:string;name:string;color?:string;ram?:string;storage?:string;quantity:number;price:number}[];shippingAddress:{name:string;phone:string;line1:string;line2?:string;city:string;state:string;pincode:string};statusHistory:{status:string;at:string;note?:string}[]};
export default async function OrderDetailsPage({params}:{params:Promise<{id:string}>}) {
  let user;try{user=await requireCustomer();}catch{redirect("/login");}
  const{id}=await params;let raw;
  try{await connectDb();raw=await Order.findOne({_id:id,user:user.id}).lean();}catch{notFound();}
  if(!raw)notFound();const order=JSON.parse(JSON.stringify(raw)) as OrderView;
  const canRequestReturn=order.status==="delivered";
  return <main className="account-page content-section"><Link href="/account" className="breadcrumbs">← Your account</Link><p className="eyebrow">ORDER DETAILS</p><h1>{order.orderNumber}</h1><div className="order-detail-head"><span className={`status status-${order.status}`}>{order.status.replaceAll("_"," ")}</span><span>Placed {new Date(order.createdAt).toLocaleDateString("en-IN")}</span></div><OrderActions orderId={order._id} status={order.status} canRequestReturn={canRequestReturn}/><div className="account-section">{order.items.map((item,index)=><article className="cart-line" key={`${item.sku}-${index}`}><div className="cart-thumb">{item.image?<Image src={item.image} alt={item.name} width={100} height={108}/>:<span>a</span>}</div><div className="cart-line-main"><b className="cart-name">{item.name}</b><small>{item.color} · {item.ram} · {item.storage} · Qty {item.quantity}</small></div><b className="cart-line-price">{formatINR(item.price*item.quantity)}</b></article>)}<div className="order-total-row"><span>Total</span><b>{formatINR(order.total)}</b></div></div><section className="account-section"><h2>Delivery address</h2><p>{order.shippingAddress.name}<br/>{order.shippingAddress.phone}<br/>{order.shippingAddress.line1} {order.shippingAddress.line2}<br/>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p></section><section className="account-section"><h2>Order updates</h2><div className="timeline">{order.statusHistory.map((history,index)=><div key={index}><span className="timeline-dot"/><b>{history.status.replaceAll("_"," ")}</b><small>{new Date(history.at).toLocaleString("en-IN")}</small>{history.note&&<p>{history.note}</p>}</div>)}</div></section></main>;
}
