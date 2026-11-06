import type { CatalogProduct } from "@/components/product-card";

export type DemoProduct = CatalogProduct & { description: string; specifications: Record<string, string> };

type VariantInput = { color: string; ram: string; storage: string; price: number; mrp?: number; stock?: number };
const variantsFor = (seed: number, skuPrefix: string, variants: VariantInput[]) => variants.map((variant, index) => ({
  _id: `${String(seed).padStart(12, "0")}${String(index + 1).padStart(12, "0")}`,
  sku: `${skuPrefix}-${variant.color.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5)}-${variant.storage.replace(/[^A-Z0-9]/gi, "").toUpperCase()}`,
  color: variant.color, ram: variant.ram, storage: variant.storage, price: variant.price, mrp: variant.mrp ?? variant.price, stock: variant.stock ?? 8,
}));
const phone = (id: number, name: string, slug: string, brand: string, image: string, description: string, specifications: Record<string, string>, variants: ReturnType<typeof variantsFor>, bestseller = false): DemoProduct => ({
  _id: String(id).padStart(24, "0"), name, slug, brand, category: "Smartphones", images: [image], featured: true, bestseller, rating: 0, reviewCount: 0, description, specifications, variants,
});

// Development-only catalog for a fresh install before MongoDB is configured/seeded.
// Production storefront data always comes from MongoDB.
export const demoCatalog: DemoProduct[] = [
  {
    _id: "000000000000000000000001", name: "iPhone 16", slug: "iphone-16", brand: "Apple", category: "Smartphones",
    images: ["/images/products/iphone-16-black.png"], featured: true, bestseller: true, rating: 0, reviewCount: 0,
    description: "Apple iPhone 16 with the A18 chip, a 6.1-inch Super Retina XDR display, Camera Control, and a 48MP Fusion camera system.",
    specifications: { Display: "6.1-inch Super Retina XDR OLED", Processor: "Apple A18", Camera: "48MP Fusion main + 12MP ultra wide", OS: "iOS", Network: "5G" },
    variants: [
      { _id: "100000000000000000000001", sku: "AST-IPH16-128-BLK", color: "Black", ram: "8GB", storage: "128GB", price: 69900, mrp: 69900, stock: 12 },
      { _id: "100000000000000000000002", sku: "AST-IPH16-256-BLK", color: "Black", ram: "8GB", storage: "256GB", price: 79900, mrp: 79900, stock: 6 },
      ...variantsFor(101, "AST-IPH16", ["White", "Teal", "Pink", "Ultramarine"].flatMap((color) => [
        { color, ram: "8GB", storage: "128GB", price: 69900, stock: 5 }, { color, ram: "8GB", storage: "256GB", price: 79900, stock: 4 },
      ])),
    ],
  },
  {
    _id: "000000000000000000000002", name: "Galaxy S25", slug: "galaxy-s25", brand: "Samsung", category: "Smartphones",
    images: ["/images/products/galaxy-s25-silver.png"], featured: true, bestseller: false, rating: 0, reviewCount: 0,
    description: "Samsung Galaxy S25 with a 6.2-inch Dynamic AMOLED 2X display, Snapdragon 8 Elite for Galaxy, and a versatile triple camera.",
    specifications: { Display: "6.2-inch Dynamic AMOLED 2X, 120Hz", Processor: "Snapdragon 8 Elite for Galaxy", Camera: "50MP wide + 12MP ultra wide + 10MP telephoto", Battery: "4,000mAh", OS: "Android", Network: "5G" },
    variants: [
      { _id: "200000000000000000000001", sku: "AST-GS25-256-SIL", color: "Silver Shadow", ram: "12GB", storage: "256GB", price: 80999, mrp: 80999, stock: 8 },
      { _id: "200000000000000000000002", sku: "AST-GS25-512-SIL", color: "Silver Shadow", ram: "12GB", storage: "512GB", price: 92999, mrp: 92999, stock: 4 },
    ],
  },
  {
    _id: "000000000000000000000003", name: "Nothing Phone (3a)", slug: "nothing-phone-3a", brand: "Nothing", category: "Smartphones",
    images: ["/images/products/nothing-phone-3a-white.jpg"], featured: true, bestseller: false, rating: 0, reviewCount: 0,
    description: "Nothing Phone (3a) pairs a 6.77-inch AMOLED display with Snapdragon 7s Gen 3, a triple camera system, and the distinctive Glyph interface.",
    specifications: { Display: "6.77-inch AMOLED, 120Hz", Processor: "Qualcomm Snapdragon 7s Gen 3", Camera: "50MP main + 50MP telephoto + 8MP ultra wide", Battery: "5,000mAh", OS: "Nothing OS 3.1 based on Android 15", Network: "5G" },
    variants: [
      { _id: "300000000000000000000001", sku: "AST-NP3A-128-WHT", color: "White", ram: "8GB", storage: "128GB", price: 24999, mrp: 24999, stock: 14 },
      { _id: "300000000000000000000002", sku: "AST-NP3A-256-BLK", color: "Black", ram: "8GB", storage: "256GB", price: 26999, mrp: 26999, stock: 9 },
    ],
  },
  {
    _id: "000000000000000000000004", name: "Google Pixel 9a", slug: "google-pixel-9a", brand: "Google", category: "Smartphones",
    images: ["/images/products/pixel-9a.png"], featured: true, bestseller: false, rating: 0, reviewCount: 0,
    description: "Google Pixel 9a with the Tensor G4 chip, a 6.3-inch Actua display, and Google’s computational photography features.",
    specifications: { Display: "6.3-inch Actua pOLED, 120Hz", Processor: "Google Tensor G4", Camera: "48MP wide + 13MP ultra wide", Battery: "5,100mAh typical", OS: "Android", Network: "5G" },
    variants: [{ _id: "400000000000000000000001", sku: "AST-PX9A-128-POR", color: "Porcelain", ram: "8GB", storage: "128GB", price: 49999, mrp: 49999, stock: 7 }],
  },
  {
    _id: "000000000000000000000005", name: "OnePlus 13R", slug: "oneplus-13r", brand: "OnePlus", category: "Smartphones",
    images: ["/images/products/oneplus-13r.png"], featured: true, bestseller: true, rating: 0, reviewCount: 0,
    description: "OnePlus 13R with a 6.78-inch LTPO display, Snapdragon 8 Gen 3 performance, and a 6,000mAh battery.",
    specifications: { Display: "6.78-inch LTPO 4.1 AMOLED, 120Hz", Processor: "Snapdragon 8 Gen 3", Camera: "50MP main + 50MP telephoto + 8MP ultra wide", Battery: "6,000mAh", OS: "OxygenOS 15 based on Android 15", Network: "5G" },
    variants: [
      { _id: "500000000000000000000001", sku: "AST-OP13R-256-AST", color: "Astral Trail", ram: "12GB", storage: "256GB", price: 42999, mrp: 42999, stock: 10 },
      { _id: "500000000000000000000002", sku: "AST-OP13R-512-AST", color: "Astral Trail", ram: "16GB", storage: "512GB", price: 49999, mrp: 49999, stock: 5 },
    ],
  },
  {
    _id: "000000000000000000000006", name: "Xiaomi 15", slug: "xiaomi-15", brand: "Xiaomi", category: "Smartphones",
    images: ["/images/products/xiaomi-15.png"], featured: true, bestseller: false, rating: 0, reviewCount: 0,
    description: "Xiaomi 15 combines a compact 6.36-inch CrystalRes display with Snapdragon 8 Elite performance and Leica co-engineered cameras.",
    specifications: { Display: "6.36-inch CrystalRes AMOLED, 1–120Hz", Processor: "Snapdragon 8 Elite", Camera: "50MP Leica triple camera", Battery: "5,240mAh", OS: "Xiaomi HyperOS", Network: "5G" },
    variants: [
      { _id: "600000000000000000000001", sku: "AST-XM15-512-WHT", color: "White", ram: "12GB", storage: "512GB", price: 64999, mrp: 64999, stock: 6 },
    ],
  },
  phone(7, "iPhone 17", "iphone-17", "Apple", "/images/products/iphone-17.png", "iPhone 17 with the A19 chip, 6.3-inch ProMotion display and a 48MP Dual Fusion camera system.", { Display: "6.3-inch Super Retina XDR OLED, 120Hz", Processor: "Apple A19", Camera: "48MP Dual Fusion main and ultra wide", OS: "iOS", Network: "5G" }, variantsFor(7, "AST-IPH17", ["Black", "White", "Mist Blue", "Sage", "Lavender"].flatMap((color) => [
    { color, ram: "8GB", storage: "256GB", price: 99900 }, { color, ram: "8GB", storage: "512GB", price: 114900 },
  ])), true),
  phone(8, "iPhone 17e", "iphone-17e", "Apple", "/images/products/iphone-17e.webp", "iPhone 17e pairs the A19 chip and a 48MP Fusion camera with a bright 6.1-inch display.", { Display: "6.1-inch Super Retina XDR OLED", Processor: "Apple A19", Camera: "48MP Fusion camera", OS: "iOS", Network: "5G" }, variantsFor(8, "AST-IPH17E", ["Black", "White", "Soft Pink"].flatMap((color) => [
    { color, ram: "8GB", storage: "256GB", price: 79900 }, { color, ram: "8GB", storage: "512GB", price: 104900 },
  ]))),
  phone(9, "iPhone Air", "iphone-air", "Apple", "/images/products/iphone-air.png", "The remarkably thin iPhone Air features an A19 Pro chip, titanium design and a 48MP Fusion camera.", { Display: "6.5-inch Super Retina XDR OLED, 120Hz", Processor: "Apple A19 Pro", Camera: "48MP Fusion camera", OS: "iOS", Network: "5G" }, variantsFor(9, "AST-IPHAIR", ["Space Black", "Cloud White", "Light Gold", "Sky Blue"].flatMap((color) => [
    { color, ram: "12GB", storage: "256GB", price: 149900 }, { color, ram: "12GB", storage: "512GB", price: 164900 }, { color, ram: "12GB", storage: "1TB", price: 194900 },
  ]))),
  phone(10, "iPhone 18 Pro", "iphone-18-pro", "Apple", "/images/products/iphone-18-pro.jpg", "iPhone 18 Pro brings the A20 Pro chip and a variable-aperture 48MP Pro Fusion camera system.", { Display: "6.3-inch Super Retina XDR OLED, 120Hz", Processor: "Apple A20 Pro", Camera: "48MP Pro Fusion triple camera", OS: "iOS", Network: "5G" }, variantsFor(10, "AST-IPH18P", ["Black", "Silver", "Glacier", "Burgundy"].flatMap((color) => [
    { color, ram: "12GB", storage: "256GB", price: 164900 }, { color, ram: "12GB", storage: "512GB", price: 184900 },
  ])), true),
  phone(11, "iPhone 18 Pro Max", "iphone-18-pro-max", "Apple", "/images/products/iphone-18-pro-max.jpg", "iPhone 18 Pro Max pairs a 6.9-inch ProMotion display and A20 Pro chip with an advanced 48MP Pro Fusion camera system.", { Display: "6.9-inch Super Retina XDR OLED, 120Hz", Processor: "Apple A20 Pro", Camera: "48MP Pro Fusion triple camera", OS: "iOS", Network: "5G" }, variantsFor(11, "AST-IPH18PM", ["Black", "Silver", "Glacier", "Burgundy"].flatMap((color) => [
    { color, ram: "12GB", storage: "256GB", price: 184900 }, { color, ram: "12GB", storage: "512GB", price: 204900 },
  ])), true),
  phone(12, "iPhone Duo", "iphone-duo", "Apple", "/images/products/iphone-duo.jpg", "iPhone Duo folds from a pocket-sized outer display into a spacious 7.6-inch canvas, powered by the A20 Pro chip.", { Display: "7.6-inch inner and 5.4-inch outer OLED, 120Hz", Processor: "Apple A20 Pro", Camera: "48MP Dual Fusion camera system", OS: "iOS", Network: "5G" }, variantsFor(12, "AST-IPHD", ["Star White", "Black"].flatMap((color) => [
    { color, ram: "12GB", storage: "256GB", price: 299900 }, { color, ram: "12GB", storage: "512GB", price: 329900 },
  ]))),
  phone(13, "Galaxy S26", "galaxy-s26", "Samsung", "/images/products/galaxy-s26.webp", "Galaxy S26 combines Galaxy AI with a bright 120Hz Dynamic AMOLED display and a versatile 50MP triple camera.", { Display: "6.3-inch Dynamic AMOLED 2X, 120Hz", Processor: "Exynos 2600", Camera: "50MP wide + 10MP telephoto + 12MP ultra wide", Battery: "4,300mAh", OS: "Android 16 with One UI", Network: "5G" }, variantsFor(13, "AST-GS26", ["Cobalt Violet", "Black", "White", "Sky Blue"].flatMap((color) => [
    { color, ram: "12GB", storage: "256GB", price: 87999 }, { color, ram: "12GB", storage: "512GB", price: 99999 },
  ])), true),
  phone(14, "Google Pixel 10", "google-pixel-10", "Google", "/images/products/pixel-10.jpg", "Pixel 10 brings Google Tensor G5, helpful AI features and a versatile triple rear camera to a compact 6.3-inch phone.", { Display: "6.3-inch Actua OLED, 120Hz", Processor: "Google Tensor G5", Camera: "48MP wide + 13MP ultra wide + 10.8MP telephoto", Battery: "4,970mAh typical", OS: "Android", Network: "5G" }, variantsFor(14, "AST-PX10", ["Indigo", "Frost", "Lemongrass", "Obsidian"].map((color) => ({ color, ram: "12GB", storage: "256GB", price: 74999 }))), true),
  phone(15, "OnePlus 15", "oneplus-15", "OnePlus", "/images/products/oneplus-15.png", "OnePlus 15 delivers Snapdragon 8 Elite Gen 5 power, a 165Hz display and a long-lasting 7,300mAh battery.", { Display: "6.78-inch LTPO AMOLED, up to 165Hz", Processor: "Snapdragon 8 Elite Gen 5", Camera: "50MP triple camera", Battery: "7,300mAh", OS: "OxygenOS 16 based on Android 16", Network: "5G" }, variantsFor(15, "AST-OP15", ["Sand Storm", "Infinite Black", "Ultra Violet"].flatMap((color) => [
    { color, ram: "12GB", storage: "256GB", price: 84999 }, { color, ram: "16GB", storage: "512GB", price: 93999 },
  ])), true),
  phone(16, "Redmi Note 15 5G", "redmi-note-15-5g", "Xiaomi", "/images/products/redmi-note-15.jpg", "Redmi Note 15 5G features a 120Hz AMOLED display, Snapdragon 6 Gen 3 and a detailed 108MP main camera.", { Display: "6.77-inch AMOLED, 120Hz", Processor: "Snapdragon 6 Gen 3", Camera: "108MP main + 8MP ultra wide", Battery: "5,520mAh", OS: "HyperOS based on Android", Network: "5G" }, variantsFor(16, "AST-RN15", ["Glacier Blue", "Black", "Mist Purple"].flatMap((color) => [
    { color, ram: "8GB", storage: "128GB", price: 19999 }, { color, ram: "8GB", storage: "256GB", price: 22999 },
  ]))),
];

export function getDemoProduct(slug: string) {
  return demoCatalog.find((product) => product.slug === slug) || null;
}

export function queryDemoProducts(params: { q?: string; brand?: string; category?: string; min?: string; max?: string; ram?: string; storage?: string; color?: string; availability?: string; sort?: string }) {
  let products = demoCatalog.filter((product) => {
    if (params.brand && product.brand.toLowerCase() !== params.brand.toLowerCase()) return false;
    if (params.category && product.category.toLowerCase() !== params.category.toLowerCase()) return false;
    if (params.q && !`${product.name} ${product.brand} ${product.description}`.toLowerCase().includes(params.q.toLowerCase())) return false;
    const matching = product.variants.filter((variant) =>
      (!params.ram || variant.ram === params.ram) && (!params.storage || variant.storage === params.storage) &&
      (!params.color || variant.color?.toLowerCase().includes(params.color.toLowerCase())) &&
      (!params.min || variant.price >= Number(params.min)) && (!params.max || variant.price <= Number(params.max)) &&
      (params.availability !== "in-stock" || variant.stock > 0));
    return matching.length > 0;
  });
  if (params.sort === "price-asc") products = [...products].sort((a, b) => Math.min(...a.variants.map((variant) => variant.price)) - Math.min(...b.variants.map((variant) => variant.price)));
  if (params.sort === "price-desc") products = [...products].sort((a, b) => Math.min(...b.variants.map((variant) => variant.price)) - Math.min(...a.variants.map((variant) => variant.price)));
  if (params.sort === "popular") products = [...products].sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
  return products;
}
