import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Smartphone, ShoppingCart, Boxes, Users, Tags, PanelsTopLeft, Settings, FileText, Layers3, Star, RotateCcw, CreditCard } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

const items = [
  ["Overview", "/admin/dashboard", LayoutDashboard], ["Products", "/admin/products", Smartphone], ["Categories & brands", "/admin/catalog", Layers3], ["Orders", "/admin/orders", ShoppingCart], ["Payments", "/admin/payments", CreditCard], ["Returns", "/admin/returns", RotateCcw], ["Inventory", "/admin/inventory", Boxes], ["Customers", "/admin/customers", Users], ["Coupons", "/admin/coupons", Tags], ["Reviews", "/admin/reviews", Star], ["Homepage", "/admin/banners", PanelsTopLeft], ["Content", "/admin/content", FileText], ["Settings", "/admin/settings", Settings],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login"); }
  const initials = admin.name.split(" ").map((part) => part[0]).join("").slice(0,2).toUpperCase();
  const moduleAccess:Record<string,string[]>={product_manager:["/admin/dashboard","/admin/products","/admin/catalog"],order_manager:["/admin/dashboard","/admin/orders","/admin/payments","/admin/returns"],inventory_manager:["/admin/dashboard","/admin/inventory"],customer_support:["/admin/dashboard","/admin/customers","/admin/reviews","/admin/returns"]};
  const visibleItems=admin.role==="super_admin"||admin.role==="admin"?items:items.filter(([,href])=>moduleAccess[admin.role]?.includes(href));
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/" className="admin-brand"><span className="brand-symbol">a</span><span>astra<span>COMMERCE</span></span></Link><div className="admin-nav-label">WORKSPACE</div><nav>{visibleItems.map(([label,href,Icon])=><Link href={href} key={href}><Icon size={17}/>{label}</Link>)}{admin.role==="super_admin"&&<Link href="/admin/team"><Users size={17}/>Admin team</Link>}</nav><div className="sidebar-bottom"><span>Storefront</span><a href="/" target="_blank" rel="noreferrer">View website ↗</a></div></aside><div className="admin-main"><header className="admin-topbar"><span>Store administration</span><div><span className="admin-avatar">{initials}</span><div><b>{admin.name}</b><small>{admin.role.replaceAll("_", " ")}</small></div><LogoutButton admin/></div></header>{children}</div></div>;
}
