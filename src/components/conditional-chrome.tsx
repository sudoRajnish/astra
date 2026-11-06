"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ConditionalChrome({ children, header, footer }: { children: ReactNode; header: ReactNode; footer: ReactNode }) {
  const pathname = usePathname() || "/";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) return children;

  return <>
    {header}
    {children}
    {footer}
  </>;
}
