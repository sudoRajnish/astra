import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Product, Review } from "@/models";
import { formatINR } from "@/lib/format";
import { AddToCart } from "@/components/add-to-cart";
import { WishlistButton } from "@/components/wishlist-button";
import { ReviewForm } from "@/components/review-form";
import { getSession } from "@/lib/auth";
import { Order } from "@/models";
import type { CatalogProduct } from "@/components/product-card";
import { getDemoProduct } from "@/lib/demo-catalog";

async function getProduct(slug: string) {
  try { await connectDb(); const product = await Product.findOne({ slug, published: true }).lean(); if (!product) {
      const demoProduct = process.env.NODE_ENV === "development" ? getDemoProduct(slug) : null;
      return demoProduct ? { product: JSON.parse(JSON.stringify(demoProduct)) as CatalogProduct & { description: string; specifications: Record<string, string>; _id: string }, reviews: [] as { rating: number; title?: string; body?: string; user?: { name?: string } }[] } : null;
    }
    const reviews = await Review.find({ product: product._id, approved: true }).populate("user", "name").sort({ createdAt: -1 }).limit(20).lean();
    const normalized=JSON.parse(JSON.stringify(product,(_key,value)=>value instanceof Map?Object.fromEntries(value):value)) as CatalogProduct & {description:string;specifications:Record<string,string>;_id:string};
    return { product: normalized, reviews: JSON.parse(JSON.stringify(reviews)) as { rating: number; title?: string; body?: string; user?: { name?: string } }[] };
  } catch {
    const demoProduct = process.env.NODE_ENV === "development" ? getDemoProduct(slug) : null;
    return demoProduct ? { product: JSON.parse(JSON.stringify(demoProduct)) as CatalogProduct & { description: string; specifications: Record<string, string>; _id: string }, reviews: [] as { rating: number; title?: string; body?: string; user?: { name?: string } }[] } : null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const data = await getProduct(slug);
  if (!data) return { title: "Product not found" };
  const description = data.product.description.slice(0, 160) || `${data.product.name} by ${data.product.brand}. View details, compare variants and shop online at Astra Mobile.`;
  const image = data.product.images?.[0];
  return { title: data.product.name, description, keywords: [data.product.name, data.product.brand, "buy online", "smartphone"], alternates: { canonical: `/products/${slug}` }, openGraph: { type: "website", title: data.product.name, description, url: `/products/${slug}`, images: image ? [{ url: image, alt: `${data.product.name} smartphone` }] : [{ url: "/og-image.png", width: 1200, height: 630, alt: "Astra Mobile smartphones" }] }, twitter: { card: "summary_large_image", title: data.product.name, description, images: [image || "/og-image.png"] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const data = await getProduct(slug); if (!data) notFound();
  const { product, reviews } = data;
  const session = await getSession();
  let canReview = false;
  if (session) { try { await connectDb(); canReview = Boolean(await Order.exists({ user: session.id, status: "delivered", "items.product": product._id })); } catch { canReview = false; } }
  const variants = product.variants.map((v) => ({ id: v._id || "", sku: v.sku || "", color: v.color || "", ram: v.ram || "", storage: v.storage || "", price: v.price, stock: v.stock }));
  const images = product.images || [];
  const startPrice = variants.length ? Math.min(...variants.map((v) => v.price)) : 0;
  const startMrp = product.variants.length ? Math.min(...product.variants.map((v: { mrp: number }) => v.mrp)) : startPrice;
  const reviewCount=product.reviewCount??0;
  const jsonLd=JSON.stringify([{"@context":"https://schema.org","@type":"Product",name:product.name,description:product.description,sku:product.variants[0]?.sku,brand:{"@type":"Brand",name:product.brand},image:images,offers:{"@type":"AggregateOffer",priceCurrency:"INR",lowPrice:startPrice,highPrice:Math.max(...variants.map(v=>v.price)),offerCount:variants.length,availability:variants.some(v=>v.stock>0)?"https://schema.org/InStock":"https://schema.org/OutOfStock",url:`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/products/${product.slug}`},...(reviewCount>0?{aggregateRating:{"@type":"AggregateRating",ratingValue:product.rating,reviewCount}}:{})},{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/`},{"@type":"ListItem",position:2,name:"Phones",item:`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/products`},{"@type":"ListItem",position:3,name:product.name,item:`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/products/${product.slug}`}]}]).replace(/</g,"\\u003c");
  return <main className="product-detail content-section"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>
    <nav className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/products">Phones</Link><span>/</span><span>{product.name}</span></nav>
    <div className="detail-layout"><div className="gallery"><div className="main-image">{images[0] ? <Image src={images[0]} alt={product.name} width={900} height={900} priority sizes="(max-width: 650px) 100vw, 55vw" /> : <div className="detail-device device-art"><div className="device-camera" /><div className="device-screen"><span>{product.brand}</span><i /></div></div>}</div>{images.length > 1 && <div className="thumb-row">{images.slice(1,5).map((image: string,index: number)=><div key={image+index}><Image src={image} alt={`${product.name} view ${index+2}`} width={100} height={100} /></div>)}</div>}</div>
      <div className="detail-copy"><p className="eyebrow">{product.brand} · {product.category}</p><h1>{product.name}</h1><div className="detail-rating">★ {product.rating ? product.rating.toFixed(1) : "New"} <span>· {product.reviewCount || 0} reviews</span></div><div className="detail-price"><strong>{formatINR(startPrice)}</strong>{startMrp > startPrice && <><del>{formatINR(startMrp)}</del><span>{Math.round((1-startPrice/startMrp)*100)}% off</span></>}</div><p className="tax-note">Inclusive of all taxes</p><p className="product-description">{product.description || "Thoughtfully designed for performance, creativity and everyday life."}</p>
        <AddToCart productId={product._id} slug={product.slug} name={product.name} variants={variants} image={product.images?.[0] || ""} /><WishlistButton productId={product._id}/>
        <div className="delivery-check"><b>Delivery availability</b><div><input placeholder="Enter pincode" maxLength={6} inputMode="numeric" aria-label="Pincode" /><button type="button">Check</button></div><small>Estimated delivery in 2–5 business days</small></div>
      </div></div>
    <section className="spec-section"><p className="eyebrow">THE DETAILS</p><h2>Made for the moments that matter.</h2><div className="spec-grid">{Object.entries(product.specifications || {}).map(([key,value])=><div key={key}><span>{key}</span><b>{String(value)}</b></div>)}</div></section>
    <section className="review-section"><div><p className="eyebrow">COMMUNITY NOTES</p><h2>Reviews & ratings</h2></div>{reviews.length ? reviews.map((review,index)=><article key={index} className="review-card"><div>★ {review.rating} <span>· {review.user?.name || "Verified customer"}</span></div><h3>{review.title}</h3><p>{review.body}</p></article>) : <p className="empty-catalog">There are no approved reviews yet.</p>}{canReview&&<ReviewForm productId={product._id}/>}</section>
  </main>;
}
