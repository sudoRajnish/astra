import type { Metadata } from "next";
import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Product, Brand, Category } from "@/models";
import { ProductCard, type CatalogProduct } from "@/components/product-card";
import { Search } from "lucide-react";
import { demoCatalog, queryDemoProducts } from "@/lib/demo-catalog";

export const metadata: Metadata = { title: "Shop smartphones", description: "Explore thoughtfully selected smartphones from Apple, Samsung, Google and Nothing. Compare models and find the phone that fits your life.", alternates: { canonical: "/products" }, openGraph: { type: "website", title: "Shop smartphones", description: "Compare and shop thoughtfully selected smartphones at Astra Mobile.", url: "/products", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Shop smartphones at Astra Mobile" }] } };
type Params = Promise<{ q?: string; brand?: string; category?: string; min?: string; max?: string; ram?: string; storage?: string; color?: string; availability?: string; sort?: string; page?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 12;
  let products: CatalogProduct[] = [];
  let brands: string[] = [];
  let categories: string[] = [];
  let total = 0;
  let unavailable = false;
  try {
    await connectDb();
    const filters: Record<string, unknown> = { published: true };
    if (params.brand) filters.brand = params.brand;
    if (params.category) filters.category = params.category;
    if (params.q) filters.$text = { $search: params.q.slice(0, 100) };
    const variant: Record<string, unknown> = {};
    if (params.min) variant.price = { ...(variant.price as object || {}), $gte: Number(params.min) };
    if (params.max) variant.price = { ...(variant.price as object || {}), $lte: Number(params.max) };
    if (params.ram) variant.ram = params.ram;
    if (params.storage) variant.storage = params.storage;
    if (params.color) variant.color = params.color;
    if (params.availability === "in-stock") variant.stock = { $gt: 0 };
    if (Object.keys(variant).length) filters.variants = { $elemMatch: variant };
    const sort: Record<string, 1 | -1> = params.sort === "price-asc" ? { "variants.price": 1 } : params.sort === "price-desc" ? { "variants.price": -1 } : params.sort === "popular" ? { bestseller: -1, rating: -1 } : { createdAt: -1 };
    const [docs, count, brandDocs, categoryDocs] = await Promise.all([
      Product.find(filters).select("name slug brand category images variants._id variants.sku variants.color variants.ram variants.storage variants.price variants.mrp variants.stock featured bestseller rating reviewCount").sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filters), Brand.find({ active: true }).select("name").sort({ name: 1 }).lean(), Category.find({ active: true }).select("name").sort({ name: 1 }).lean(),
    ]);
    products = JSON.parse(JSON.stringify(docs)) as CatalogProduct[];
    total = count; brands = brandDocs.map((b) => b.name); categories = categoryDocs.map((c) => c.name);
  } catch {
    if (process.env.NODE_ENV === "development") {
      const demoProducts = queryDemoProducts(params);
      products = JSON.parse(JSON.stringify(demoProducts.slice((page - 1) * limit, page * limit))) as CatalogProduct[];
      total = demoProducts.length;
      brands = [...new Set(demoCatalog.map((product) => product.brand))];
      categories = [...new Set(demoCatalog.map((product) => product.category))];
    } else unavailable = true;
  }
  if (process.env.NODE_ENV === "development" && !unavailable && total === 0) {
    const demoProducts = queryDemoProducts(params);
    products = JSON.parse(JSON.stringify(demoProducts.slice((page - 1) * limit, page * limit))) as CatalogProduct[];
    total = demoProducts.length;
    brands = [...new Set(demoCatalog.map((product) => product.brand))];
    categories = [...new Set(demoCatalog.map((product) => product.category))];
  }
  return <main className="listing-page content-section">
    <div className="listing-intro"><p className="eyebrow">THE ASTRA COLLECTION</p><h1>Find your next favorite.</h1><p>Thoughtful technology, chosen with care.</p></div>
    <div className="listing-layout">
      <form method="get" className="filter-panel">
        <h2>Refine your search</h2>
        {params.q && <input type="hidden" name="q" value={params.q} />}
        <label>Category<select name="category" defaultValue={params.category || ""}><option value="">All categories</option>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Brand<select name="brand" defaultValue={params.brand || ""}><option value="">All brands</option>{brands.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Price range<div className="price-filter"><input name="min" type="number" placeholder="Min ₹" defaultValue={params.min} min="0" /><input name="max" type="number" placeholder="Max ₹" defaultValue={params.max} min="0" /></div></label>
        <label>RAM<select name="ram" defaultValue={params.ram || ""}><option value="">Any RAM</option>{["4GB", "6GB", "8GB", "12GB", "16GB"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Storage<select name="storage" defaultValue={params.storage || ""}><option value="">Any storage</option>{["64GB", "128GB", "256GB", "512GB", "1TB"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Color<input name="color" placeholder="e.g. Midnight" defaultValue={params.color} /></label>
        <label>Availability<select name="availability" defaultValue={params.availability || ""}><option value="">All products</option><option value="in-stock">In stock</option></select></label>
        <label>Sort by<select name="sort" defaultValue={params.sort || "newest"}><option value="newest">Newest</option><option value="popular">Popularity</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        <button className="button button-dark" type="submit">Apply filters <Search size={15} /></button>
        <Link className="clear-filters" href="/products">Clear all</Link>
      </form>
      <section className="listing-results"><div className="results-head"><div><h2>{params.q ? `Results for “${params.q}”` : params.category || params.brand || "All smartphones"}</h2><p>{total} {total === 1 ? "device" : "devices"}</p></div><span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span></div>
        {unavailable ? <div className="empty-catalog">The catalog is temporarily unavailable. Please try again shortly.</div> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="empty-catalog">No products match these filters yet. Try adjusting your search.</div>}
        <div className="pagination">{page > 1 && <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>← Previous</Link>}{page < Math.ceil(total / limit) && <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>Next →</Link>}</div>
      </section>
    </div>
  </main>;
}
