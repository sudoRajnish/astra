import bcrypt from "bcryptjs";
import { connectDb } from "../src/lib/db";
import { Banner, Brand, Category, CMSPage, Coupon, HomepageSection, Order, Product, Role, User, WebsiteSetting } from "../src/models";
import { demoCatalog } from "../src/lib/demo-catalog";

async function main() {
  await connectDb();
  const categories = [
    { name: "Smartphones", slug: "smartphones", description: "Thoughtful smartphones for every day." },
    { name: "Accessories", slug: "accessories", description: "The finishing touches for your device." },
  ];
  const brands = ["Apple", "Samsung", "Nothing", "Google", "OnePlus", "Xiaomi", "Astra"].map((name) => ({ name, slug: name.toLowerCase().replaceAll(" ", "-"), description: `Explore ${name} devices at Astra.` }));
  await Promise.all(categories.map((item) => Category.updateOne({ slug: item.slug }, { $setOnInsert: { ...item, active: true } }, { upsert: true })));
  await Promise.all(brands.map((item) => Brand.updateOne({ slug: item.slug }, { $setOnInsert: { ...item, active: true } }, { upsert: true })));
  await Coupon.updateOne({ code: "WELCOME10" }, { $setOnInsert: { code: "WELCOME10", type: "percentage", value: 10, minOrder: 5000, maxDiscount: 1500, perCustomerLimit: 1, firstOrderOnly: true, usedCount: 0, active: true } }, { upsert: true });

  const sampleProducts = [
    { name: "iPhone 16", slug: "iphone-16", brand: "Apple", category: "Smartphones", description: "A capable, beautifully considered phone for photography, communication and everyday creativity.", images: ["/images/products/iphone-16-black.png"], featured: true, bestseller: true, variants: [{ sku: "AST-IPH16-128-BLK", color: "Black", ram: "8GB", storage: "128GB", price: 69900, mrp: 79900, stock: 12 }, { sku: "AST-IPH16-256-BLK", color: "Black", ram: "8GB", storage: "256GB", price: 79900, mrp: 89900, stock: 6 }], specifications: { Display: "6.1-inch OLED", Processor: "A18", Camera: "48MP Fusion camera", Battery: "All-day battery", OS: "iOS", Network: "5G" } },
    { name: "Galaxy S25", slug: "galaxy-s25", brand: "Samsung", category: "Smartphones", description: "A compact flagship with a vivid display, capable camera system and powerful performance.", images: ["/images/products/galaxy-s25-silver.png"], featured: true, bestseller: false, variants: [{ sku: "AST-GS25-256-NVY", color: "Navy", ram: "12GB", storage: "256GB", price: 80999, mrp: 84999, stock: 8 }, { sku: "AST-GS25-512-NVY", color: "Navy", ram: "12GB", storage: "512GB", price: 92999, mrp: 96999, stock: 4 }], specifications: { Display: "6.2-inch Dynamic AMOLED 2X", Processor: "Snapdragon 8 Elite", Camera: "50MP triple camera", Battery: "4,000mAh", OS: "Android", Network: "5G" } },
    { name: "Phone (3a)", slug: "nothing-phone-3a", brand: "Nothing", category: "Smartphones", description: "Distinctive design meets thoughtful everyday performance in a phone with a little more personality.", images: ["/images/products/nothing-phone-3a-white.jpg"], featured: true, bestseller: false, variants: [{ sku: "AST-NP3A-128-WHT", color: "White", ram: "8GB", storage: "128GB", price: 24999, mrp: 27999, stock: 14 }, { sku: "AST-NP3A-256-BLK", color: "Black", ram: "8GB", storage: "256GB", price: 26999, mrp: 29999, stock: 9 }], specifications: { Display: "6.77-inch AMOLED", Processor: "Snapdragon 7s Gen 3", Camera: "50MP triple camera", Battery: "5,000mAh", OS: "Android", Network: "5G" } },
    { name: "Pixel 9a", slug: "google-pixel-9a", brand: "Google", category: "Smartphones", description: "A smart, helpful phone with a thoughtful camera and a clean software experience.", images: ["/images/products/pixel-9a.png"], featured: true, bestseller: false, variants: [{ sku: "AST-PX9A-128-POR", color: "Porcelain", ram: "8GB", storage: "128GB", price: 49999, mrp: 52999, stock: 7 }], specifications: { Display: "6.3-inch Actua OLED", Processor: "Google Tensor G4", Camera: "48MP dual camera", Battery: "5,100mAh", OS: "Android", Network: "5G" } },
    { name: "OnePlus 13R", slug: "oneplus-13r", brand: "OnePlus", category: "Smartphones", description: "OnePlus 13R with a 6.78-inch LTPO display, Snapdragon 8 Gen 3 performance, and a 6,000mAh battery.", images: ["/images/products/oneplus-13r.png"], featured: true, bestseller: true, variants: [{ sku: "AST-OP13R-256-AST", color: "Astral Trail", ram: "12GB", storage: "256GB", price: 42999, mrp: 42999, stock: 10 }, { sku: "AST-OP13R-512-AST", color: "Astral Trail", ram: "16GB", storage: "512GB", price: 49999, mrp: 49999, stock: 5 }], specifications: { Display: "6.78-inch LTPO 4.1 AMOLED, 120Hz", Processor: "Snapdragon 8 Gen 3", Camera: "50MP main + 50MP telephoto + 8MP ultra wide", Battery: "6,000mAh", OS: "OxygenOS 15 based on Android 15", Network: "5G" } },
    { name: "Xiaomi 15", slug: "xiaomi-15", brand: "Xiaomi", category: "Smartphones", description: "Xiaomi 15 combines a compact 6.36-inch CrystalRes display with Snapdragon 8 Elite performance and Leica co-engineered cameras.", images: ["/images/products/xiaomi-15.png"], featured: true, bestseller: false, variants: [{ sku: "AST-XM15-512-WHT", color: "White", ram: "12GB", storage: "512GB", price: 64999, mrp: 64999, stock: 6 }], specifications: { Display: "6.36-inch CrystalRes AMOLED, 1–120Hz", Processor: "Snapdragon 8 Elite", Camera: "50MP Leica triple camera", Battery: "5,240mAh", OS: "Xiaomi HyperOS", Network: "5G" } },
  ];
  for (const item of sampleProducts) {
    await Product.updateOne({ slug: item.slug }, { $setOnInsert: { ...item, published: true, publishedAt: new Date() } }, { upsert: true });
    await Product.updateOne({ slug: item.slug, images: { $size: 0 } }, { $set: { images: item.images } });
  }
  for (const item of demoCatalog) {
    await Product.updateOne({ slug: item.slug }, { $setOnInsert: { ...item, published: true, publishedAt: new Date() } }, { upsert: true });
    const saved = await Product.findOne({ slug: item.slug });
    if (!saved) continue;
    const knownSkus = new Set<string>(saved.variants.map((variant: { sku: string }) => variant.sku));
    const missingVariants = item.variants.filter((variant) => variant.sku && !knownSkus.has(variant.sku));
    if (missingVariants.length) {
      saved.variants.push(...missingVariants.map(({ sku, color, ram, storage, price, mrp, stock }) => ({ sku: sku!, color: color || "", ram: ram || "", storage: storage || "", price, mrp, stock })));
      await saved.save();
    }
    if (!saved.images.length && item.images?.length) {
      saved.images = item.images;
      await saved.save();
    }
  }
  await Product.updateOne({ slug: "iphone-18-pro-max", images: "/images/products/iphone-18-pro.jpg" }, { $set: { images: ["/images/products/iphone-18-pro-max.jpg"] } });

  const banners = [{ title: "Find the one that feels like you.", subtitle: "Thoughtful technology. Beautifully chosen. Discover phones that make every day a little more extraordinary.", ctaText: "Explore the collection", ctaHref: "/products", order: 0, active: true }];
  await Promise.all(banners.map((banner) => Banner.updateOne({ title: banner.title }, { $setOnInsert: banner }, { upsert: true })));
  const sections = [
    { key: "trust", heading: "Store promises", description: "", order: 0, visible: true },
    { key: "featured", heading: "Standout devices", description: "Considered picks for a life in motion.", order: 1, visible: true },
    { key: "brands", heading: "Your next favorite is waiting.", description: "From everyday essentials to the extraordinary, find your perfect fit across the brands you love.", order: 2, visible: true },
    { key: "arrivals", heading: "Just landed", description: "The latest releases, picked for you.", order: 3, visible: true },
    { key: "newsletter", heading: "Good things, occasionally.", description: "New releases, thoughtful recommendations and members-only offers.", order: 4, visible: true },
  ];
  await Promise.all(sections.map((section) => HomepageSection.updateOne({ key: section.key }, { $setOnInsert: section }, { upsert: true })));
  const pages = [
    { slug: "about", title: "Good technology, thoughtfully chosen.", content: "Astra brings together the devices we believe are worth your time. Our team looks for thoughtful design, useful features and honest value.\n\nWe want choosing a phone to feel simple and personal. Ask us anything; real people are here to help.", metaTitle: "About Astra Mobile", metaDescription: "Get to know Astra Mobile and our thoughtful approach to choosing technology.", published: true },
    { slug: "faq", title: "Frequently asked questions", content: "Are all phones genuine? Yes. Every device is sourced from authorized channels and sold as new unless the product page says otherwise.\n\nHow do I track an order? Sign in and open your order from the account page.\n\nCan I return a phone? Contact our support team within seven days of delivery. Items must meet the conditions in our returns policy.", metaTitle: "Astra FAQs", metaDescription: "Answers to common questions about shopping at Astra Mobile.", published: true },
    { slug: "shipping-policy", title: "Shipping, with care.", content: "Orders are carefully packed and dispatched to serviceable Indian pin codes. Delivery estimates shown at checkout are indicative and may vary by location.\n\nShipping charges and the free delivery threshold are shown during checkout and can change by store configuration.", metaTitle: "Shipping policy", metaDescription: "Learn about delivery timelines and shipping at Astra Mobile.", published: true },
    { slug: "return-refund-policy", title: "Returns & refunds.", content: "If something is not right, contact support within seven days of delivery. Devices must be returned with original packaging, accessories and proof of purchase.\n\nRefunds for online payments are processed to the original payment method after the returned item is inspected. Cash on delivery refunds are coordinated by our support team.", metaTitle: "Returns and refunds", metaDescription: "Review Astra Mobile's return and refund policy.", published: true },
    { slug: "privacy-policy", title: "Your privacy matters.", content: "We use account, delivery and order information to operate the store, fulfill orders and provide customer support. We do not store card details. Razorpay processes online payments.\n\nContact the store if you have questions about accessing or correcting your information.", metaTitle: "Privacy policy", metaDescription: "Learn how Astra Mobile handles your personal information.", published: true },
    { slug: "terms-and-conditions", title: "The terms, plainly.", content: "Product prices, availability and promotions may change. An order is accepted when the store confirms it. Product descriptions and imagery are provided to help you make an informed choice.\n\nStore purchases are subject to applicable Indian consumer and tax laws.", metaTitle: "Terms and conditions", metaDescription: "Terms for shopping with Astra Mobile.", published: true },
  ];
  await Promise.all(pages.map((page) => CMSPage.updateOne({ slug: page.slug }, { $setOnInsert: page }, { upsert: true })));

  const settings = { storeName: "Astra Mobile", storePhone: "", storeAddress: "", currency: "INR", timeZone: "Asia/Kolkata", shippingFee: Number(process.env.SHIPPING_FEE || 199), freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 25000), lowStockThreshold: 3, codEnabled: process.env.ENABLE_COD !== "false", deliveryEstimate: "2–5 business days", seoTitle: "Astra — Phones, chosen thoughtfully", seoDescription: "Discover thoughtfully chosen smartphones, honest advice and a buying experience designed around you.", seoIndexing: process.env.SEO_INDEXING !== "false" };
  await Promise.all(Object.entries(settings).map(([key, value]) => WebsiteSetting.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true })));
  const roles = [
    { key: "super_admin", label: "Super Admin", permissions: ["*"] },
    { key: "admin", label: "Admin", permissions: ["*"] },
    { key: "product_manager", label: "Product Manager", permissions: ["catalog:*", "inventory:read"] },
    { key: "order_manager", label: "Order Manager", permissions: ["orders:*", "customers:read"] },
    { key: "inventory_manager", label: "Inventory Manager", permissions: ["inventory:*", "catalog:read"] },
    { key: "customer_support", label: "Customer Support", permissions: ["customers:read", "customers:manage", "returns:manage", "reviews:moderate"] },
  ];
  await Promise.all(roles.map((role) => Role.updateOne({ key: role.key }, { $set: { label: role.label, permissions: role.permissions }, $setOnInsert: { active: true } }, { upsert: true })));

  const demoPassword = process.env.DEMO_CUSTOMER_PASSWORD;
  if (demoPassword && demoPassword.length >= 10) {
    await User.updateOne({ email: "demo@example.com" }, { $setOnInsert: { name: "Demo Customer", email: "demo@example.com", passwordHash: await bcrypt.hash(demoPassword, 12), role: "customer", active: true } }, { upsert: true });
    const customer = await User.findOne({ email: "demo@example.com" });
    const phone = await Product.findOne({ slug: "iphone-16" });
    const variant = phone?.variants[0];
    if (customer && phone && variant) await Order.updateOne({ orderNumber: "AST-DEMO-0001" }, { $setOnInsert: { orderNumber: "AST-DEMO-0001", user: customer._id, items: [{ product: phone._id, name: phone.name, slug: phone.slug, sku: variant.sku, variantId: variant._id, color: variant.color, ram: variant.ram, storage: variant.storage, price: variant.price, quantity: 1 }], shippingAddress: { name: customer.name, phone: "9000000000", line1: "Demo address", city: "Bengaluru", state: "Karnataka", pincode: "560001" }, subtotal: variant.price, shipping: 0, total: variant.price, paymentMethod: "cod", paymentStatus: "paid", status: "delivered", statusHistory: [{ status: "delivered", note: "Seed demo order" }] } }, { upsert: true });
  }
  await mongooseDisconnect.disconnect();
  console.log("Seed data is ready. Existing records were preserved.");
}

import { default as mongooseDisconnect } from "mongoose";
void main().catch(async (error) => { console.error("Seed failed:", error instanceof Error ? error.message : "unknown error"); await mongooseDisconnect.disconnect(); process.exitCode = 1; });
