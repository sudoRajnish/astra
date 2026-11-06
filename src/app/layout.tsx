import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Sora } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ConditionalChrome } from "@/components/conditional-chrome";
import { connectDb } from "@/lib/db";
import { WebsiteSetting } from "@/models";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

const metadataBase = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  let storeName = "Astra Mobile";
  let title = "Astra — Phones, chosen thoughtfully";
  let description = "Discover thoughtfully chosen smartphones, compare the details that matter, and find your next favorite at Astra Mobile.";
  try {
    await connectDb();
    const settings = await WebsiteSetting.find({ key: { $in: ["storeName", "seoTitle", "seoDescription"] } }).lean();
    const values = Object.fromEntries(settings.map((setting) => [setting.key, typeof setting.value === "string" ? setting.value.trim() : ""]));
    storeName = values.storeName || storeName;
    title = values.seoTitle || title;
    description = values.seoDescription || description;
  } catch { /* Use the branded defaults while the store settings are unavailable. */ }

  return {
    metadataBase,
    applicationName: storeName,
    title: { default: title, template: `%s | ${storeName}` },
    description,
    keywords: ["smartphones", "mobile phones", "buy smartphones online", "Apple phones", "Samsung phones", "Nothing phones", "Google Pixel"],
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }], apple: "/apple-touch-icon.png" },
    openGraph: { type: "website", locale: "en_IN", siteName: storeName, title, description, url: "/", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${storeName} — thoughtfully chosen smartphones` }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ConditionalChrome header={<SiteHeader />} footer={<footer className="site-footer"><div className="footer-top"><div className="footer-brand"><Link href="/" className="brand-mark"><span className="brand-symbol">a</span> astra</Link><p>Good technology, thoughtfully chosen.<br />A little more you, every day.</p></div><div className="footer-links"><div><b>Explore</b><Link href="/products">All phones</Link><Link href="/products?sort=newest">New arrivals</Link><Link href="/products?sort=popular">Bestsellers</Link><Link href="/products?category=Accessories">Accessories</Link></div><div><b>Help & info</b><Link href="/about">Our story</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQs</Link><Link href="/shipping-policy">Shipping</Link></div><div><b>The details</b><Link href="/return-refund-policy">Returns</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-and-conditions">Terms</Link><Link href="/admin/login">Admin</Link></div></div></div><div className="footer-bottom"><span>Â© {new Date().getFullYear()} Astra Mobile. Made for the way you live.</span><span>India Â· INR â‚¹</span></div></footer>}>{children}</ConditionalChrome></body>
    </html>
  );
}

