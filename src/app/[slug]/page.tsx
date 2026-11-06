import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { CMSPage, WebsiteSetting } from "@/models";

export const dynamic = "force-dynamic";
const knownPages = new Set(["about", "contact", "faq", "shipping-policy", "return-refund-policy", "privacy-policy", "terms-and-conditions"]);

async function fetchPage(slug: string) {
  try {
    await connectDb();
    return await CMSPage.findOne({ slug, published: true }).lean();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!knownPages.has(slug)) return {};
  const page = await fetchPage(slug);
  const title = page?.metaTitle || page?.title || slug.replaceAll("-", " ");
  const description = page?.metaDescription || "Helpful information for shopping with Astra Mobile.";
  return { title, description, alternates: { canonical: `/${slug}` }, openGraph: { type: "website", title, description, url: `/${slug}`, images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Astra Mobile — thoughtfully chosen smartphones" }] }, twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] } };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!knownPages.has(slug)) notFound();
  const page = await fetchPage(slug);
  if (!page && slug !== "contact" && slug !== "about") {
    return <main className="cms-page content-section"><p className="eyebrow">ASTRA INFORMATION</p><h1>Content is being prepared.</h1><p>The store administrator can publish this page from the website content manager.</p></main>;
  }

  let contact: Record<string, string> = {};
  if (slug === "contact") {
    try {
      await connectDb();
      const docs = await WebsiteSetting.find({ key: { $in: ["storePhone", "storeAddress"] } }).lean();
      contact = Object.fromEntries(docs.map((doc) => [doc.key, String(doc.value || "")])) as Record<string, string>;
    } catch {
      contact = {};
    }
  }

  const aboutCopy = "Astra is a single destination for finding a smartphone that fits your everyday life. Explore the latest devices, compare the details that matter to you, and choose your favorite with clear product information at every step.\n\nFrom browsing and saving favorites to checkout and order updates, we want your shopping experience to feel simple, personal, and dependable. Our team is here to help you make a confident choice.";
  const title = page?.title || (slug === "contact" ? "We’re here to help." : "A little about us.");

  return <main className="cms-page content-section">
    <p className="eyebrow">ASTRA · {slug.replaceAll("-", " ").toUpperCase()}</p>
    <h1>{title}</h1>
    {slug === "contact" ? <div className="contact-layout"><div>
      <p>For help with a device or order, use the store contact details below.</p>
      {contact.storePhone && <p>Phone: <a href={`tel:${contact.storePhone}`}>{contact.storePhone}</a></p>}
      {contact.storeAddress && <p>{contact.storeAddress}</p>}
      {!contact.storePhone && !contact.storeAddress && <p>Store contact details have not been added yet.</p>}
    </div></div> : <div className="cms-body">{String(page?.content || (slug === "about" ? aboutCopy : "")).split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
  </main>;
}
