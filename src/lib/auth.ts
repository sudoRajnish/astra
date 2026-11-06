import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role, User } from "@/models";
import { connectDb } from "@/lib/db";

const COOKIE_NAME = "phone_shop_session";
const secretText = process.env.AUTH_SECRET;
function secret(): Uint8Array {
  if (!secretText || secretText.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secretText);
}

export type SessionUser = { id: string; name: string; email: string; role: string; sessionVersion?: number };
const adminRoles = new Set(["super_admin", "admin", "product_manager", "order_manager", "inventory_manager", "customer_support"]);

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role, sv: user.sessionVersion ?? 0 })
    .setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.name !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { id: payload.sub, name: payload.name, email: payload.email, role: payload.role, sessionVersion: typeof payload.sv === "number" ? payload.sv : 0 };
  } catch { return null; }
}

export async function requireAdmin(allowed?: string[], requiredPermission?: string | string[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !adminRoles.has(session.role) || (allowed && !allowed.includes(session.role) && session.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const active = await getActiveUser(session.id);
  if (!active || active.role !== session.role || (active.sessionVersion ?? 0) !== (session.sessionVersion ?? 0)) throw new Error("FORBIDDEN");
  if (allowed && session.role !== "super_admin") {
    const permissionArea = session.role === "product_manager" || allowed.includes("product_manager") ? "catalog" : session.role === "order_manager" || allowed.includes("order_manager") ? "orders" : session.role === "inventory_manager" || allowed.includes("inventory_manager") ? "inventory" : session.role === "customer_support" || allowed.includes("customer_support") ? "customers" : "admin";
    const role = await Role.findOne({ key: session.role }).select("permissions active").lean();
    const permissions = role?.permissions ?? [];
    const required = requiredPermission ? (Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]) : [`${permissionArea}:read`];
    const hasAccess = Boolean(role?.active && (permissions.includes("*") || required.some((permission) => permissions.includes(permission) || permissions.includes(`${permission.split(":")[0]}:*`))));
    if (!hasAccess) throw new Error("FORBIDDEN");
  }
  return { ...session, role: active.role, name: active.name, email: active.email };
}

export async function requireCustomer(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "customer") throw new Error("UNAUTHENTICATED");
  const active = await getActiveUser(session.id);
  if (!active || active.role !== "customer" || (active.sessionVersion ?? 0) !== (session.sessionVersion ?? 0)) throw new Error("UNAUTHENTICATED");
  return { ...session, name: active.name, email: active.email };
}

export async function getCustomerSession(): Promise<SessionUser | null> {
  try { return await requireCustomer(); } catch { return null; }
}

export async function getActiveUser(id: string) {
  await connectDb();
  return User.findOne({ _id: id, active: true }).select("name email role sessionVersion").lean();
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
