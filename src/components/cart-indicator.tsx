"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getCartSnapshot, getServerCartSnapshot, subscribeCart } from "@/components/add-to-cart";

export function CartIndicator() {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const count = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" className="icon-link header-cart-link" aria-label={`Shopping bag, ${count} items`}>
      <span className="header-icon-wrap"><ShoppingBag size={19} />{count > 0 && <span className="cart-count">{count > 99 ? "99+" : count}</span>}</span>
      <span className="header-action-label">Cart</span>
    </Link>
  );
}
