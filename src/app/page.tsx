import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";
import { connectDb } from "@/lib/db";
import { Banner, HomepageSection, Product } from "@/models";
import { ProductCard, type CatalogProduct } from "@/components/product-card";
import { MotionIntro, ScrollEffects } from "@/components/scroll-effects";
import { demoCatalog } from "@/lib/demo-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

async function getHomeData() {
  try {
    await connectDb();
    const [featured, arrivals, banners, sections] = await Promise.all([
      Product.find({ published: true, featured: true }).select("name slug brand category images variants._id variants.sku variants.color variants.ram variants.storage variants.price variants.mrp variants.stock rating reviewCount bestseller").sort({ createdAt: -1 }).limit(8).lean(),
      Product.find({ published: true }).select("name slug brand category images variants._id variants.sku variants.color variants.ram variants.storage variants.price variants.mrp variants.stock rating reviewCount bestseller").sort({ createdAt: -1 }).limit(8).lean(),
      Banner.find({ active: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }] }, { $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }] }).sort({ order: 1 }).limit(2).lean(),
      HomepageSection.find().sort({ order: 1 }).lean(),
    ]);
    const emptyDevelopmentCatalog = process.env.NODE_ENV === "development" && featured.length === 0 && arrivals.length === 0;
    return { featured: JSON.parse(JSON.stringify(emptyDevelopmentCatalog ? demoCatalog : featured)) as CatalogProduct[], arrivals: JSON.parse(JSON.stringify(emptyDevelopmentCatalog ? demoCatalog : arrivals)) as CatalogProduct[], banners: JSON.parse(JSON.stringify(banners)) as { title?: string; subtitle?: string; ctaText?: string; ctaHref?: string; imageDesktop?: string; imageMobile?: string }[], sections: Object.fromEntries(JSON.parse(JSON.stringify(sections)).map((item:{key:string;heading?:string;description?:string;visible:boolean})=>[item.key,item])) as Record<string,{key:string;heading?:string;description?:string;visible:boolean}>, unavailable: false };
  } catch {
    const demo = process.env.NODE_ENV === "development" ? JSON.parse(JSON.stringify(demoCatalog)) as CatalogProduct[] : [] as CatalogProduct[];
    return { featured: demo, arrivals: demo, banners: [] as { title?: string; subtitle?: string; ctaText?: string; ctaHref?: string; imageDesktop?: string; imageMobile?: string }[], sections: {} as Record<string,{key:string;heading?:string;description?:string;visible:boolean}>, unavailable: process.env.NODE_ENV !== "development" };
  }
}

export default async function Home() {
  const { featured, arrivals, banners, sections, unavailable } = await getHomeData();
  const visible=(key:string)=>sections[key]?.visible??true;
  const primaryBanner = banners[0];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const structuredData = JSON.stringify([
    { "@context": "https://schema.org", "@type": "OnlineStore", name: "Astra Mobile", url: baseUrl, logo: `${baseUrl}/icon.svg` },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Astra Mobile", url: baseUrl, potentialAction: { "@type": "SearchAction", target: `${baseUrl}/products?q={search_term_string}`, "query-input": "required name=search_term_string" } },
  ]).replace(/</g, "\\u003c");
  return <ScrollEffects><main><script type="application/ld+json" dangerouslySetInnerHTML={{__html:structuredData}} />
    <section className={`hero${primaryBanner?.imageDesktop?" has-banner":""}`} style={primaryBanner?.imageDesktop?{backgroundImage:`url(${primaryBanner.imageDesktop})`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>
      <MotionIntro><div className="hero-copy"><p className="eyebrow light-eyebrow">{primaryBanner?"THE ASTRA EDIT":"THE NEW STANDARD"}</p><h1>{primaryBanner?.title||<>Find the one<br/>that feels <em>like you.</em></>}</h1><p className="hero-lede">{primaryBanner?.subtitle||"Thoughtful technology. Beautifully chosen. Discover phones that make every day a little more extraordinary."}</p><Link href={primaryBanner?.ctaHref||"/products"} className="button button-light">{primaryBanner?.ctaText||"Explore the collection"} <ArrowRight size={17} /></Link><div className="hero-note"><span className="hero-dot" /> Curated for how you live</div></div></MotionIntro>
      <div className="hero-product" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><Image className="hero-product-photo" src="/images/products/iphone-16-black.png" alt="" width={900} height={900} priority sizes="(max-width: 650px) 360px, 460px"/><div className="hero-phone-label"><span>JUST ARRIVED</span><b>iPhone 16</b><small>Meet your next favorite.</small></div><div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✧</div></div>
      <div className="hero-index"><span>01</span><i /> 03</div>
    </section>
    {banners[1] && <section className="promo-strip"><div><p className="eyebrow">A NOTE FROM ASTRA</p><h2>{banners[1].title}</h2><p>{banners[1].subtitle}</p></div><Link href={banners[1].ctaHref || "/products"} className="text-link">{banners[1].ctaText || "Discover more"} <ArrowUpRight size={16} /></Link></section>}
    {visible("trust")&&<section className="trust-row"><div><Truck /><span><b>Thoughtful delivery</b><small>Carefully packed, right to you</small></span></div><div><ShieldCheck /><span><b>100% authentic</b><small>Only genuine, verified devices</small></span></div><div><RotateCcw /><span><b>Easy 7-day returns</b><small>Shop with complete confidence</small></span></div><div><Headphones /><span><b>Here to help</b><small>Real people, whenever you need</small></span></div></section>}
    {visible("featured")&&<section className="content-section"><div className="section-heading"><div><p className="eyebrow">THE ASTRA EDIT</p><h2>{sections.featured?.heading||"Standout devices"}</h2><p>{sections.featured?.description||"Considered picks for a life in motion."}</p></div><Link href="/products?featured=true" className="text-link">View all <ArrowRight size={16} /></Link></div>
      {featured.length ? <div className="product-grid">{featured.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="empty-catalog">{unavailable ? "Our collection is getting ready. Please check back shortly." : "Our editors are making their first picks. Explore the full collection."}<Link href="/products" className="text-link">Browse all phones <ArrowRight size={16} /></Link></div>}
    </section>}
    {visible("brands")&&<section className="brand-callout"><div className="brand-callout-copy"><p className="eyebrow light-eyebrow">A MORE PERSONAL PICK</p><h2>{sections.brands?.heading||<>Your next favorite<br/>is waiting.</>}</h2><p>{sections.brands?.description||"From everyday essentials to the extraordinary, find your perfect fit across the brands you love."}</p><Link href="/products" className="button button-light">Shop all phones <ArrowRight size={17} /></Link></div><div className="brand-orbit" aria-hidden="true"><div className="brand-orbit-inner">a</div><span>APPLE</span><span>SAMSUNG</span><span>NOTHING</span><span>GOOGLE</span></div></section>}
    {visible("arrivals")&&<section className="content-section arrivals-section"><div className="section-heading"><div><p className="eyebrow">FRESH FINDS</p><h2>{sections.arrivals?.heading||"Just landed"}</h2><p>{sections.arrivals?.description||"The latest releases, picked for you."}</p></div><Link href="/products?sort=newest" className="text-link">See new arrivals <ArrowRight size={16} /></Link></div>
      {arrivals.length ? <div className="product-grid">{arrivals.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="empty-catalog">New arrivals will appear here as soon as theyâ€™re published.</div>}
    </section>}
    {visible("newsletter")&&<section className="newsletter" id="newsletter"><div><p className="eyebrow">A LITTLE ASTRA IN YOUR INBOX</p><h2>{sections.newsletter?.heading||"Good things, occasionally."}</h2><p>{sections.newsletter?.description||"New releases, thoughtful recommendations and members-only offers."}</p></div><form action="/api/newsletter" method="post"><input type="email" name="email" placeholder="Your email address" required aria-label="Email address" /><button className="button button-dark" type="submit">Count me in <ArrowRight size={16} /></button></form></section>}
  </main></ScrollEffects>;
}
