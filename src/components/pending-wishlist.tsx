"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PendingWishlist() {
  const router = useRouter();
  useEffect(() => {
    let pending: string[];
    try { pending = JSON.parse(localStorage.getItem("astra_pending_wishlist") || "[]") as string[]; }
    catch { localStorage.removeItem("astra_pending_wishlist"); return; }
    if (!pending.length) return;
    let cancelled = false;
    void (async () => {
      const remaining: string[] = [];
      for (const productId of pending) {
        try {
          const response = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
          if (!response.ok) remaining.push(productId);
        } catch { remaining.push(productId); }
      }
      if (cancelled) return;
      if (remaining.length) localStorage.setItem("astra_pending_wishlist", JSON.stringify(remaining));
      else localStorage.removeItem("astra_pending_wishlist");
      if (remaining.length !== pending.length) router.refresh();
    })();
    return () => { cancelled = true; };
  }, [router]);
  return null;
}
