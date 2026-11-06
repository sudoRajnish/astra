import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

const input = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  try {
    const body = input.parse(await request.json());
    await connectDb();
    if (!(await rateLimit(request, "customer-login", 8, 15 * 60 * 1000))) return NextResponse.json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, { status: 429 });
    const user = await User.findOne({ email: body.email.toLowerCase(), active: true }).select("+passwordHash name email role sessionVersion");
    const valid = user ? await bcrypt.compare(body.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    console.error("Login failed", error);
    return NextResponse.json({ error: "Login is unavailable. Check server configuration and try again." }, { status: 503 });
  }
}
