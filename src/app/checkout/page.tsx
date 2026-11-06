import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default function CheckoutPage() { return <main className="checkout-page content-section"><p className="eyebrow">ALMOST YOURS</p><h1>Checkout</h1><p className="checkout-intro">A few details, and we’ll take it from here.</p><CheckoutForm /></main>; }
