# Astra Mobile Store

A premium smartphone storefront built with Next.js App Router, TypeScript, Tailwind CSS, MongoDB/Mongoose, signed HTTP-only sessions, Razorpay, Cloudinary, and configurable SMTP. The storefront and admin pages read catalog, order, content, and settings data from MongoDB. Analytics are database-backed.

## Requirements

- Node.js 20.19+ (Node 24 is also supported)
- MongoDB Atlas or a MongoDB replica set. Checkout uses multi-document transactions.
- Cloudinary account for admin image uploads
- Razorpay account for online payments (optional in local development)
- SMTP credentials to send contact and order emails (optional)

## Local setup

```powershell
npm ci
```

Edit the ignored `.env.local` file in the project root and fill in the values you have. `.env.example` documents the full variable list. Set `MONGODB_URI` to an Atlas/replica-set URI and `AUTH_SECRET` to a random secret of at least 32 characters. Keep provider secrets server-side; only the Razorpay Key ID is sent to Checkout.

```powershell
npm run seed
npm run admin:create -- admin@example.com "Store Administrator"
npm run dev
```

Open `http://localhost:3000`. Use `/admin/login` for the dashboard. The admin creation command asks for the password without echoing it and stores only a bcrypt hash. The seed script is idempotent and preserves existing records. It adds sample phones with local product photos, categories, brands, banners, content pages, settings, roles and a welcome coupon. To add a demo customer and order, set `DEMO_CUSTOMER_PASSWORD` (at least 10 characters) before running `npm run seed`. Sample image source notes are in `public/images/products/SOURCES.md`.

## Environment variables

See [.env.example](.env.example) for all configuration keys. In particular:

- `MONGODB_URI`: production MongoDB URI; checkout requires transaction support.
- `AUTH_SECRET`: at least 32 random characters; rotate by expiring all sessions.
- `CLOUDINARY_*`: used only by the authenticated server upload route.
- `RAZORPAY_*`: order creation, signature verification, refunds and webhooks.
- `EMAIL_SERVER_*`, `EMAIL_FROM`, `STORE_EMAIL`: SMTP and contact destination.
- `ENABLE_COD`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD`: fallback defaults before database settings are saved.
- `NEXT_PUBLIC_APP_URL`: canonical site origin, sitemap and structured data base URL.

Do not set a private integration secret under a `NEXT_PUBLIC_` name.

## Payments and media

Configure the Razorpay keys, then register `https://your-domain/api/payments/webhook` in Razorpay. Subscribe to `payment.captured`, `order.paid`, and `payment.failed`. Browser success is not trusted: the server checks the HMAC signature and fetches the payment from Razorpay to confirm captured status, amount, currency and order association.

Admin image uploads accept JPEG, PNG, WebP and AVIF up to 8 MB. The server checks file signatures and uploads to the `astra-store` Cloudinary folder. Store no media API secret in browser code.

## Production deployment

1. Provision MongoDB Atlas with a replica set and restrict network access to the deployment.
2. Set production environment variables in the hosting provider; set `NODE_ENV=production` and `NEXT_PUBLIC_APP_URL` to the canonical HTTPS URL.
3. Configure a strong `AUTH_SECRET`, provider credentials, Razorpay webhook URL, and SMTP sender.
4. Build and start with `npm run build` and `npm run start` (or deploy with the provider's Next.js runtime).
5. Run `npm run seed` once, create the first administrator with `npm run admin:create -- email "Name"`, then remove any temporary shell secrets.
6. Test a low-value Razorpay payment/refund in the provider's test environment before enabling live keys.
7. Set **Allow search engines to index the store** in Admin → Settings when public content is ready. The default robots policy disallows indexing.

## Quality checks

```powershell
npm run typecheck
npm run lint
npm run build
```

These checks do not replace payment, email, transaction, or responsive browser testing against configured external services. No live MongoDB or payment credentials were available in this workspace, so live order/payment workflows have not been exercised here.

## Current implementation boundary

Implemented: database-backed catalog/search/filter pages, product variants and server-derived pricing, credential registration/login and password recovery, secure sessions, customer profile/address/password management, customer orders and wishlist, COD and Razorpay checkout verification, transactional stock deduction/restoration, coupon validation, return requests, Razorpay/manual refund recording, payment transaction ledger, reviews with delivered-order eligibility and moderation, Cloudinary uploads, CMS pages, homepage banners/section visibility, category/brand CRUD, inventory history, role-checked admin APIs and role-filtered navigation, activity logs, SEO metadata/sitemap/robots, and date-filtered analytics queries.

Still needed before calling the platform fully production-ready: customer email verification; database-backed cart synchronization across devices (the current guest cart is browser-local); scheduled publishing; admin notifications; invoice PDF generation; CMS rich text/footer/social settings; per-product/category/brand coupon targeting UI; serviceable-pincode management; and automatic cleanup/release of inventory for Razorpay orders abandoned without a webhook or browser close callback. Product editing and duplication cover variants, specifications, images, pricing, stock and publication flags. The dashboard now shows database-backed revenue, order-status, top-product and date-filtered daily metrics. Password recovery is implemented, but sending links requires working SMTP and `NEXT_PUBLIC_APP_URL`. Run an external security review and exercise the real provider workflows before production launch.

See [docs/API.md](docs/API.md) for the initial route map and behavior notes.
