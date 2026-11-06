import mongoose, { Schema, model, models } from "mongoose";

const variantSchema = new Schema({
  sku: { type: String, required: true, trim: true },
  color: { type: String, required: true, trim: true },
  ram: { type: String, required: true },
  storage: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  image: { type: String, default: "" },
}, { _id: true });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  brand: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  variants: { type: [variantSchema], validate: [(v: unknown[]) => v.length > 0, "At least one variant is required"] },
  specifications: { type: Map, of: String, default: {} },
  featured: { type: Boolean, default: false, index: true },
  bestseller: { type: Boolean, default: false },
  published: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date, default: null },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });
productSchema.index({ name: "text", brand: "text", description: "text" });
productSchema.index({ published: 1, createdAt: -1 });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "super_admin", "admin", "product_manager", "order_manager", "inventory_manager", "customer_support"], default: "customer", index: true },
  active: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0 },
  addresses: [{ label: String, name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String, isDefault: Boolean }],
}, { timestamps: true });

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  slug: String,
  sku: { type: String, required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  color: String,
  ram: String,
  storage: String,
  image: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, unique: true, sparse: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  shippingAddress: { name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String },
  subtotal: { type: Number, required: true },
  shipping: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  status: { type: String, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned", "refund_pending", "refunded"], default: "pending", index: true },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String, by: String }],
  razorpayOrderId: String,
  trackingNumber: String,
  courier: String,
  stockRestored: { type: Boolean, default: false },
  couponCode: String,
  discount: { type: Number, default: 0 },
}, { timestamps: true });
orderSchema.index({ user: 1, createdAt: -1 });

const couponSchema = new Schema({ code: { type: String, required: true, unique: true, uppercase: true, trim: true }, type: { type: String, enum: ["percentage", "fixed"], required: true }, value: { type: Number, required: true, min: 0 }, minOrder: { type: Number, default: 0 }, maxDiscount: Number, expiresAt: Date, usageLimit: Number, perCustomerLimit: { type: Number, default: 1 }, firstOrderOnly: { type: Boolean, default: false }, productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }], categories: [String], brands: [String], usedCount: { type: Number, default: 0 }, active: { type: Boolean, default: true } }, { timestamps: true });
const categorySchema = new Schema({ name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, description: String, image: String, active: { type: Boolean, default: true } }, { timestamps: true });
const brandSchema = new Schema({ name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, description: String, logo: String, active: { type: Boolean, default: true } }, { timestamps: true });
const reviewSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, product: { type: Schema.Types.ObjectId, ref: "Product", required: true }, rating: { type: Number, required: true, min: 1, max: 5 }, title: String, body: String, approved: { type: Boolean, default: false } }, { timestamps: true });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
const settingsSchema = new Schema({ key: { type: String, unique: true, required: true }, value: Schema.Types.Mixed }, { timestamps: true });
const bannerSchema = new Schema({ title: String, subtitle: String, imageDesktop: String, imageMobile: String, ctaText: String, ctaHref: String, order: { type: Number, default: 0 }, active: { type: Boolean, default: true }, startsAt: Date, endsAt: Date }, { timestamps: true });
const inventoryTransactionSchema = new Schema({ product: { type: Schema.Types.ObjectId, ref: "Product", required: true }, variantId: { type: Schema.Types.ObjectId, required: true }, sku: String, delta: { type: Number, required: true }, reason: { type: String, required: true }, actor: String, order: { type: Schema.Types.ObjectId, ref: "Order" } }, { timestamps: true });
const activitySchema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: "User" }, actorName: String, action: { type: String, required: true }, entity: String, entityId: String, changes: Schema.Types.Mixed }, { timestamps: true });
const cmsPageSchema = new Schema({ slug: { type: String, required: true, unique: true }, title: String, content: String, metaTitle: String, metaDescription: String, published: { type: Boolean, default: true } }, { timestamps: true });
const newsletterSchema = new Schema({ email: { type: String, unique: true, lowercase: true, required: true }, active: { type: Boolean, default: true } }, { timestamps: true });
const wishlistSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, product: { type: Schema.Types.ObjectId, ref: "Product", required: true } }, { timestamps: true });
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });
const cartSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, items: [{ product: { type: Schema.Types.ObjectId, ref: "Product", required: true }, variantId: { type: Schema.Types.ObjectId, required: true }, quantity: { type: Number, min: 1, max: 10, required: true } }] }, { timestamps: true });
const addressSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, label: String, name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String, isDefault: Boolean }, { timestamps: true });
const roleSchema = new Schema({ key: { type: String, required: true, unique: true }, label: { type: String, required: true }, permissions: { type: [String], default: [] }, active: { type: Boolean, default: true } }, { timestamps: true });
const permissionSchema = new Schema({ key: { type: String, required: true, unique: true }, label: { type: String, required: true }, module: { type: String, required: true } }, { timestamps: true });
const paymentSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true }, provider: { type: String, enum: ["razorpay", "cod"], required: true }, providerOrderId: String, transactionId: String, amount: { type: Number, required: true }, currency: { type: String, default: "INR" }, status: { type: String, enum: ["created", "authorized", "captured", "failed", "refunded"], default: "created" }, method: String, failureReason: String }, { timestamps: true });
paymentSchema.index({ provider: 1, transactionId: 1 }, { unique: true, sparse: true });
const returnSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: "Order", required: true }, user: { type: Schema.Types.ObjectId, ref: "User", required: true }, reason: { type: String, required: true }, details: String, status: { type: String, enum: ["requested", "approved", "rejected", "received", "refunded"], default: "requested" }, adminNote: String }, { timestamps: true });
returnSchema.index({ order: 1 }, { unique: true });
const refundSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: "Order", required: true }, payment: { type: Schema.Types.ObjectId, ref: "Payment" }, amount: { type: Number, required: true }, providerRefundId: String, status: { type: String, enum: ["pending", "processed", "failed"], default: "pending" }, reason: String, processedBy: String }, { timestamps: true });
refundSchema.index({ order: 1 }, { unique: true });
const notificationSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", index: true }, type: { type: String, required: true }, title: { type: String, required: true }, body: String, readAt: Date, href: String }, { timestamps: true });
const homepageSectionSchema = new Schema({ key: { type: String, required: true, unique: true }, heading: String, description: String, visible: { type: Boolean, default: true }, order: { type: Number, default: 0 }, productSlugs: [String] }, { timestamps: true });
const rateLimitSchema = new Schema({ key: { type: String, required: true }, bucket: { type: Number, required: true }, count: { type: Number, default: 0, required: true }, expiresAt: { type: Date, required: true } }, { timestamps: true });
rateLimitSchema.index({ key: 1, bucket: 1 }, { unique: true });
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Product = models.Product ?? model("Product", productSchema);
export const User = models.User ?? model("User", userSchema);
export const Order = models.Order ?? model("Order", orderSchema);
export const Coupon = models.Coupon ?? model("Coupon", couponSchema);
export const Category = models.Category ?? model("Category", categorySchema);
export const Brand = models.Brand ?? model("Brand", brandSchema);
export const Review = models.Review ?? model("Review", reviewSchema);
export const WebsiteSetting = models.WebsiteSetting ?? model("WebsiteSetting", settingsSchema);
export const Banner = models.Banner ?? model("Banner", bannerSchema);
export const InventoryTransaction = models.InventoryTransaction ?? model("InventoryTransaction", inventoryTransactionSchema);
export const AdminActivityLog = models.AdminActivityLog ?? model("AdminActivityLog", activitySchema);
export const CMSPage = models.CMSPage ?? model("CMSPage", cmsPageSchema);
export const NewsletterSubscriber = models.NewsletterSubscriber ?? model("NewsletterSubscriber", newsletterSchema);
export const Wishlist = models.Wishlist ?? model("Wishlist", wishlistSchema);
export const Cart = models.Cart ?? model("Cart", cartSchema);
export const Address = models.Address ?? model("Address", addressSchema);
export const Role = models.Role ?? model("Role", roleSchema);
export const Permission = models.Permission ?? model("Permission", permissionSchema);
export const Payment = models.Payment ?? model("Payment", paymentSchema);
export const ReturnRequest = models.ReturnRequest ?? model("ReturnRequest", returnSchema);
export const Refund = models.Refund ?? model("Refund", refundSchema);
export const Notification = models.Notification ?? model("Notification", notificationSchema);
export const HomepageSection = models.HomepageSection ?? model("HomepageSection", homepageSectionSchema);
export const RateLimit = models.RateLimit ?? model("RateLimit", rateLimitSchema);

export type ProductDocument = mongoose.InferSchemaType<typeof productSchema>;
