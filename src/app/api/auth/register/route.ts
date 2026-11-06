import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { User } from "@/models";
import { rateLimit } from "@/lib/rate-limit";

const input = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(254), password: z.string().min(10).max(128) });
export async function POST(request: Request) {
  try {
    const body = input.parse(await request.json());
    await connectDb();
    if (!(await rateLimit(request, "customer-register", 5, 60 * 60 * 1000))) return NextResponse.json({ error: "Too many accounts were created from this connection. Try again later." }, { status: 429 });
    const email = body.email.toLowerCase();
    if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({ name: body.name, email, passwordHash, role: "customer" });
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Registration is unavailable. Check server configuration and try again." }, { status: 503 });
  }
}
