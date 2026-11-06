import type { MetadataRoute } from "next";
import { connectDb } from "@/lib/db";
import { WebsiteSetting } from "@/models";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let index = process.env.NODE_ENV === "production" && process.env.SEO_INDEXING !== "false";
  if (process.env.NODE_ENV === "production") {
    try {
      await connectDb();
      const setting = await WebsiteSetting.findOne({ key: "seoIndexing" }).lean();
      if (setting) index = setting.value === true;
    } catch { /* Production defaults to crawlable if settings are temporarily unavailable. */ }
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: index ? { userAgent: "*", allow: "/", disallow: ["/admin/", "/account/", "/api/"] } : { userAgent: "*", disallow: "/" },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
