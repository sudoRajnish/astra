import Link from "next/link";
import { Heart, Search, UserRound } from "lucide-react";
import { CartIndicator } from "@/components/cart-indicator";

export function SiteHeader() {
  return <>
    <div className="announcement">A better way to discover your next phone <span>·</span> Free delivery over ₹25,000</div>
    <header className="site-header">
      <Link href="/" className="brand-mark" aria-label="Astra home"><span className="brand-symbol">a</span> astra</Link>
      <form action="/products" className="search-box"><Search size={17} /><input name="q" placeholder="Search phones, brands and more" aria-label="Search products" /><button type="submit">Search</button></form>
      <nav className="header-actions" aria-label="Main navigation">
        <Link className="header-text-link" href="/">Home</Link><Link className="header-text-link" href="/products">Shop phones</Link><Link className="header-text-link" href="/about">About us</Link>
        <Link href="/account/wishlist" className="icon-link" aria-label="My favorites"><Heart size={19} /><span className="header-action-label">Favorites</span></Link>
        <Link href="/account" className="icon-link" aria-label="My account"><UserRound size={19} /><span className="header-action-label">Account</span></Link>
        <CartIndicator />
      </nav>
    </header>
  </>;
}
