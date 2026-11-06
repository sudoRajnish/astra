import "server-only";
import { createHash } from "node:crypto";
import { connectDb } from "@/lib/db";
import { RateLimit } from "@/models";

export async function rateLimit(request: Request, scope: string, max: number, windowMs: number): Promise<boolean> {
  await connectDb();
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(`${scope}:${address}`).digest("hex");
  const bucket = Math.floor(Date.now() / windowMs);
  const expiresAt = new Date((bucket + 2) * windowMs);
  try {
    const result = await RateLimit.findOneAndUpdate({ key, bucket }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return result.count <= max;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      const result = await RateLimit.findOneAndUpdate({ key, bucket }, { $inc: { count: 1 } }, { new: true });
      return (result?.count ?? max + 1) <= max;
    }
    throw error;
  }
}
