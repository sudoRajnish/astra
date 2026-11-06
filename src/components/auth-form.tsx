"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function AuthForm({ mode, admin = false }: { mode: "login" | "register"; admin?: boolean }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [showPassword, setShowPassword] = useState(false);
  async function submit(data: FormData) {
    setBusy(true); setError("");
    try {
      const response = await fetch(admin ? "/api/admin/login" : `/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), email: data.get("email"), password: data.get("password") }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/admin")
        ? requestedNext
        : "/account";
      router.replace(admin ? "/admin/dashboard" : safeNext); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to continue."); }
    finally { setBusy(false); }
  }
  return <form action={submit} className="auth-form">
    {mode === "register" && !admin && <label>Your name<input required name="name" autoComplete="name" minLength={2} maxLength={100} /></label>}
    <label>Email address<input required name="email" type="email" autoComplete="email" maxLength={254} /></label>
    <label>Password<span className="password-input-wrap"><input required name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 10} maxLength={128} /><button className="password-visibility-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-dark" disabled={busy}>{busy ? "Please wait…" : admin ? "Sign in securely" : mode === "login" ? "Sign in" : "Create account"}</button>
  </form>;
}
