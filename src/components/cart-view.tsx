"use client";
import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { getCartSnapshot, getServerCartSnapshot, subscribeCart, writeCart } from "@/components/add-to-cart";

export function CartView() {
  const items=useSyncExternalStore(subscribeCart,getCartSnapshot,getServerCartSnapshot);
  function update(lines: Parameters<typeof writeCart>[0]) { writeCart(lines); }
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!items.length) return <div className="cart-empty"><div className="empty-bag">a</div><h1>Your bag is taking a little breather.</h1><p>Find something that makes you smile, and it’ll be here.</p><Link href="/products" className="button button-dark">Explore phones <ArrowRight size={16} /></Link></div>;
  return <div className="cart-layout"><section className="cart-lines">{items.map((item) => <article className="cart-line" key={`${item.productId}-${item.variantId}`}><Link className="cart-thumb" href={`/products/${item.slug}`}>{item.image ? <Image src={item.image} alt={item.name} width={100} height={108} /> : <span>a</span>}</Link><div className="cart-line-main"><Link href={`/products/${item.slug}`} className="cart-name">{item.name}</Link><small>{item.color} · {item.ram} RAM · {item.storage}</small><div className="cart-row-actions"><div className="small-quantity"><button onClick={() => update(items.map((x) => x === item ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}>−</button><span>{item.quantity}</span><button onClick={() => update(items.map((x) => x === item ? { ...x, quantity: Math.min(10, x.quantity + 1) } : x))}>+</button></div><button className="remove-line" onClick={() => update(items.filter((x) => x !== item))}><Trash2 size={14} /> Remove</button></div></div><b className="cart-line-price">{formatINR(item.price * item.quantity)}</b></article>)}</section>
    <aside className="cart-summary"><p className="eyebrow">YOUR ORDER</p><h2>Summary</h2><div><span>Subtotal</span><b>{formatINR(subtotal)}</b></div><div><span>Shipping</span><span>{subtotal >= 25000 ? "Free" : "Calculated at checkout"}</span></div><p className="cart-shipping-note">{subtotal >= 25000 ? "You’ve unlocked free delivery." : `Free delivery on orders over ${formatINR(25000)}.`}</p><Link className="button button-dark checkout-link" href="/checkout">Continue to checkout <ArrowRight size={16} /></Link><Link className="continue-shopping" href="/products">Continue shopping</Link></aside></div>;
}
