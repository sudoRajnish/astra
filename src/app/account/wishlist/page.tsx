import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerSession } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Wishlist } from "@/models";
import { ProductCard, type CatalogProduct } from "@/components/product-card";
import { PendingWishlist } from "@/components/pending-wishlist";
export const dynamic="force-dynamic";
export const metadata = { title: "Your favorites", robots: { index: false, follow: false } };
export default async function WishlistPage(){const session=await getCustomerSession();if(!session)redirect("/login?next=%2Faccount%2Fwishlist");let products:CatalogProduct[]=[];try{await connectDb();const docs=await Wishlist.find({user:session.id}).populate({path:"product",match:{published:true},select:"name slug brand category images variants.price variants.mrp variants.stock rating bestseller"}).sort({createdAt:-1}).lean();products=JSON.parse(JSON.stringify(docs.map(doc=>doc.product).filter(Boolean)));}catch{}return <main className="content-section wishlist-page"><PendingWishlist/><Link href="/account" className="breadcrumbs">← Your account</Link><p className="eyebrow">THE ONES YOU LOVE</p><h1>Your wishlist</h1>{products.length?<div className="product-grid">{products.map(product=><ProductCard key={product.slug} product={product}/>)}</div>:<div className="empty-catalog">No saved products yet. <Link href="/products" className="text-link">Browse the collection →</Link></div>}</main>}
