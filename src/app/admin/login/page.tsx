import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
export default async function AdminLoginPage() { const session = await getSession(); if (session && session.role !== "customer") redirect("/admin/dashboard"); return <main className="auth-page admin-auth-page"><div className="auth-card"><p className="eyebrow">ASTRA COMMERCE · ADMIN</p><h1>Welcome back.</h1><p>Sign in with your administrator account.</p><AuthForm mode="login" admin /></div></main>; }
