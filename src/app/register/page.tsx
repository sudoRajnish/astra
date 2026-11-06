import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Create an account", robots: { index: false, follow: false } };
export default function RegisterPage() { return <main className="auth-page"><div className="auth-card"><p className="eyebrow">A GOOD PLACE TO BEGIN</p><h1>Make yourself at home.</h1><p>Create an account for a more personal shopping experience.</p><AuthForm mode="register" /><div className="auth-foot">Already have an account? <Link href="/login">Sign in</Link></div></div></main>; }
