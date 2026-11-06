import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { WishlistButton } from "@/components/wishlist-button";
import { QuickAddToCart } from "@/components/add-to-cart";

export type CatalogProduct = {
  _id: unknown; name: string; slug: string; brand: string; category: string; images?: string[];
  variants: { _id?: string; sku?: string; color?: string; ram?: string; storage?: string; price: number; mrp: number; stock: number }[];
  featured?: boolean; bestseller?: boolean; rating?: number; reviewCount?: number; description?: string; specifications?: Record<string, string>;
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const variants = product.variants ?? [];
  const image = product.images?.[0] || "";
  const purchaseVariant = [...variants]
    .filter((variant) => variant.stock > 0 && variant._id && variant.sku)
    .sort((a, b) => a.price - b.price)[0];
  const price = purchaseVariant?.price ?? (variants.length ? Math.min(...variants.map((variant) => variant.price)) : 0);
  const mrp = purchaseVariant?.mrp ?? (variants.length ? Math.min(...variants.map((variant) => variant.mrp)) : price);
  const addVariant = purchaseVariant ? {
    id: String(purchaseVariant._id), sku: purchaseVariant.sku || "", color: purchaseVariant.color || "",
    ram: purchaseVariant.ram || "", storage: purchaseVariant.storage || "", price: purchaseVariant.price, stock: purchaseVariant.stock,
  } : null;

  return <article className="product-card" data-reveal>
    <WishlistButton productId={String(product._id)} compact />
    <Link className="product-visual" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
      {image ? <Image src={image} alt={product.name} width={600} height={600} sizes="(max-width: 560px) 45vw, (max-width: 850px) 40vw, 25vw" /> : <div className="device-art"><div className="device-camera" /><div className="device-screen"><span>{product.brand}</span><i /></div></div>}
      {product.bestseller ? <span className="product-badge">Best Seller</span> : mrp > price ? <span className="product-badge">Sale</span> : <span className="product-badge">New</span>}
      {variants.every((variant) => variant.stock <= 0) && <span className="stock-badge">Out of stock</span>}
    </Link>
    <div className="product-copy">
      <p className="eyebrow">{product.brand}</p>
      <Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link>
      <div className="product-variant-note">{purchaseVariant ? [purchaseVariant.ram, purchaseVariant.storage, purchaseVariant.color].filter(Boolean).join(" · ") : "Currently unavailable"}</div>
      <div className="rating-line">★ <span>{product.rating ? product.rating.toFixed(1) : "New"}</span>{product.reviewCount ? <span>({product.reviewCount})</span> : null}</div>
      <div className="price-row"><strong>{formatINR(price)}</strong>{mrp > price && <del>{formatINR(mrp)}</del>}</div>
      <div className="product-card-actions">
        <Link className="product-details-button" href={`/products/${product.slug}`}>View Details</Link>
        <QuickAddToCart productId={String(product._id)} slug={product.slug} name={product.name} image={image} variant={addVariant} />
      </div>
    </div>
  </article>;
}
