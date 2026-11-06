# API route map

All request bodies are validated on the server with Zod. Responses return JSON unless noted. Authenticated routes use the `phone_shop_session` HTTP-only cookie.

## Public catalog and content

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/api/products` | Published catalog, text search (`q`), brand/category filters, sort and pagination. |
| `GET` | `/api/products/:slug` | Published product and approved reviews. |
| `POST` | `/api/newsletter` | Add/update a subscriber. Accepts JSON or an HTML form post. |
| `POST` | `/api/contact` | Validates and sends a store contact email through configured SMTP. |

## Authentication and customer

| Method | Route | Behavior |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creates a customer with a bcrypt password hash and signs in. |
| `POST` | `/api/auth/login` | Verifies credentials and sets a seven-day HTTP-only session. |
| `POST` | `/api/auth/forgot-password` | Sends a one-time, one-hour reset link without revealing whether an email has an account. Requires SMTP and `NEXT_PUBLIC_APP_URL`. |
| `POST` | `/api/auth/reset-password` | Consumes a reset token, hashes the new password, and revokes existing sessions. |
| `POST` | `/api/auth/logout` | Clears the session cookie. |
| `PATCH` | `/api/account/profile` | Updates profile name and saved addresses; optionally changes password after verifying the current password. |
| `POST` | `/api/orders` | Requires an active customer. Prices, discounts, shipping and stock are resolved from MongoDB in a transaction. Send a UUID in `Idempotency-Key`. |
| `POST` | `/api/payments/verify` | Verifies Razorpay HMAC, then fetches provider payment state and amount before marking paid. |
| `POST` | `/api/payments/failure` | Cancels the current customer's unpaid Razorpay order and releases stock. |
| `POST` | `/api/payments/webhook` | Verifies `x-razorpay-signature` with the webhook secret. |
| `GET/POST/DELETE` | `/api/wishlist` | Reads, saves and removes the signed-in customer's products. |
| `POST` | `/api/reviews` | Submits a review only when the customer has a delivered order containing that product. Reviews await moderation. |
| `POST` | `/api/account/orders/:id/cancel` | Cancels eligible unpaid orders and restores stock once. |
| `POST` | `/api/account/returns` | Opens one return request for an eligible delivered order within seven days. |

Order creation body shape:

```json
{
  "items": [{ "productId": "24-hex-id", "variantId": "24-hex-id", "quantity": 1 }],
  "paymentMethod": "cod",
  "address": {
    "name": "Customer Name",
    "phone": "9876543210",
    "line1": "12 Example Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "coupon": "WELCOME10"
}
```

For `paymentMethod: "razorpay"`, the response includes a provider order ID and public Key ID for Razorpay Checkout. The server never trusts the client-reported amount or success state.

## Admin

Every `/api/admin/*` route checks the active user, role and permission group on the server. The browser sidebar is not an authorization boundary.

| Method | Route | Behavior |
| --- | --- | --- |
| `POST` | `/api/admin/login` | Admin-only credential sign-in. |
| `GET/POST` | `/api/admin/products` | Search products or create a product with one or more variants. |
| `PATCH/DELETE` | `/api/admin/products/:id` | Edit catalog fields, variants, specifications, images and publication flags; refuses to remove variants tied to past orders or delete products with order history. |
| `GET/POST` | `/api/admin/taxonomy` | List/create categories and brands. |
| `PATCH/DELETE` | `/api/admin/taxonomy/:id` | Edit category/brand fields, activate/deactivate, or delete an unused record. |
| `GET/PATCH` | `/api/admin/orders` | List/filter orders and perform valid status transitions. Cancels/restores stock transactionally. |
| `POST` | `/api/admin/inventory` | Apply a signed stock delta and write an inventory transaction. |
| `GET/PATCH` | `/api/admin/customers` | List/search customer details without password hashes; activate/deactivate. |
| `GET/POST` | `/api/admin/coupons` | List/create percentage or fixed coupons with minimum, usage, expiry and first-order rules. |
| `PATCH` | `/api/admin/coupons/:id` | Activate/deactivate a coupon. |
| `GET/PATCH` | `/api/admin/reviews` | List, approve, or delete reviews. |
| `GET/POST/PATCH/DELETE` | `/api/admin/banners` | Create, schedule, order, activate or delete homepage banners. |
| `GET/PUT` | `/api/admin/homepage-sections` | Manage section visibility, headings, descriptions and ordering. |
| `GET/PUT` | `/api/admin/content` | Read/save editable CMS page content and SEO fields. |
| `GET/PUT` | `/api/admin/settings` | Read/save store, shipping, COD, low-stock and global SEO settings. Secret keys are not accepted. |
| `POST` | `/api/admin/media` | Authenticated Cloudinary image upload with file signature and size validation. |
| `GET/PATCH` | `/api/admin/returns` | Review return requests and restock a received return once. |
| `POST` | `/api/admin/refunds` | Process a full Razorpay refund or record a manually verified COD refund. |
| `GET/POST` | `/api/admin/team` | Super Admin lists roles or creates an administrator. Passwords are hashed. |
| `PATCH` | `/api/admin/team/:id` | Super Admin changes an admin role or active state. |

## Operational notes

- Checkout and stock adjustments require MongoDB transactions; use Atlas or a replica set.
- Provider API keys and webhook signing secrets are server environment variables.
- Admin activity records store actor, action, entity and selected before/after values.
- Rate limiting uses a MongoDB-backed window counter with TTL cleanup.
- Error responses do not include stack traces; server logs retain operational details.
