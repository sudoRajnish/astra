import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

const roles = ["super_admin", "admin", "product_manager", "order_manager", "inventory_manager", "customer_support"];
const input = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  try {
    const body = input.parse(await request.json()); await connectDb();
    if (!(await rateLimit(request, "admin-login", 5, 15 * 60 * 1000))) return NextResponse.json({ error: "Too many administrator sign-in attempts. Try again in 15 minutes." }, { status: 429 });
    const user = await User.findOne({ email: body.email.toLowerCase(), active: true, role: { $in: roles } }).select("+passwordHash name email role sessionVersion");
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return NextResponse.json({ error: "Admin email or password is incorrect." }, { status: 401 });
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion });
    return NextResponse.json({ ok: true });
  } catch (error) { if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid login details." }, { status: 400 }); console.error("Admin login failed", error); return NextResponse.json({ error: "Admin sign-in is unavailable." }, { status: 503 }); }
}
