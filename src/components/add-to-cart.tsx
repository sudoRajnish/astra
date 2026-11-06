"use client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export type CartLine = { productId: string; slug: string; name: string; variantId: string; sku: string; color: string; ram: string; storage: string; price: number; image: string; quantity: number };
const KEY = "astra_cart_v1";
export function readCart(): CartLine[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]") as CartLine[]; } catch { return []; } }
export function writeCart(items: CartLine[]) { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event("astra-cart")); }
const EMPTY_CART:CartLine[]=[];
let lastRaw:string|null=null;
let lastSnapshot:CartLine[]=EMPTY_CART;
export function getCartSnapshot():CartLine[]{const raw=localStorage.getItem(KEY);if(raw!==lastRaw){lastRaw=raw;try{lastSnapshot=raw?JSON.parse(raw) as CartLine[]:EMPTY_CART;}catch{lastSnapshot=EMPTY_CART;}}return lastSnapshot;}
export function getServerCartSnapshot():CartLine[]{return EMPTY_CART;}
export function subscribeCart(callback:()=>void){window.addEventListener("astra-cart",callback);window.addEventListener("storage",callback);return()=>{window.removeEventListener("astra-cart",callback);window.removeEventListener("storage",callback);};}

export function AddToCart({ productId, slug, name, variants, image }: { productId: string; slug: string; name: string; image: string; variants: { id: string; sku: string; color: string; ram: string; storage: string; price: number; stock: number }[] }) {
  const [variant, setVariant] = useState(variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = variants.find((item) => item.id === variant);
  function add() {
    if (!selected || selected.stock < quantity) return;
    const cart = readCart();
    const existing = cart.find((line) => line.productId === productId && line.variantId === variant);
    if (existing) existing.quantity = Math.min(selected.stock, existing.quantity + quantity);
    else cart.push({ productId, slug, name, variantId: variant, sku: selected.sku, color: selected.color, ram: selected.ram, storage: selected.storage, price: selected.price, image, quantity });
    writeCart(cart); setAdded(true); window.setTimeout(() => setAdded(false), 2200);
  }
  return <div className="buy-panel">
    <label>Choose your configuration<select value={variant} onChange={(e) => { setVariant(e.target.value); setQuantity(1); }}>{variants.map((v) => <option key={v.id} value={v.id}>{v.color} · {v.ram} RAM · {v.storage} · ₹{v.price.toLocaleString("en-IN")}{v.stock < 1 ? " · Out of stock" : ""}</option>)}</select></label>
    <div className="quantity-control"><span>Quantity</span><div><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><b>{quantity}</b><button type="button" onClick={() => setQuantity(Math.min(selected?.stock || 1, quantity + 1))} aria-label="Increase quantity">+</button></div><small>{selected?.stock ? `${selected.stock} available` : "Currently unavailable"}</small></div>
    <button className="button button-dark add-cart-button" type="button" disabled={!selected || selected.stock < 1} onClick={add}><ShoppingBag size={16} />{added ? "Added to your bag" : selected?.stock ? "Add to bag" : "Out of stock"}</button>
    <p className="secure-note">Secure checkout · Easy returns · Genuine devices</p>
  </div>;
}

export function QuickAddToCart({ productId, slug, name, variant, image }: { productId: string; slug: string; name: string; image: string; variant: { id: string; sku: string; color: string; ram: string; storage: string; price: number; stock: number } | null }) {
  const [added, setAdded] = useState(false);
  function add() {
    if (!variant || variant.stock < 1) return;
    const cart = readCart();
    const existing = cart.find((line) => line.productId === productId && line.variantId === variant.id);
    if (existing) existing.quantity = Math.min(variant.stock, existing.quantity + 1);
    else cart.push({ productId, slug, name, variantId: variant.id, sku: variant.sku, color: variant.color, ram: variant.ram, storage: variant.storage, price: variant.price, image, quantity: 1 });
    writeCart(cart);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }
  return <button className="quick-add-button" type="button" onClick={add} disabled={!variant || variant.stock < 1}>
    {!variant || variant.stock < 1 ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
  </button>;
}
