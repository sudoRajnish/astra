import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export default function LoginPage() { return <main className="auth-page"><div className="auth-card"><p className="eyebrow">WELCOME BACK</p><h1>Good to see you.</h1><p>Sign in to see your orders, favorites and saved details.</p><AuthForm mode="login" /><div className="auth-foot">New to Astra? <Link href="/register">Create an account</Link></div></div></main>; }
