import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
export const metadata: Metadata = { title: "Your bag", robots: { index: false, follow: false } };
export default function CartPage() { return <main className="cart-page content-section"><p className="eyebrow">A FEW GOOD CHOICES</p><h1>Your bag</h1><CartView /></main>; }
