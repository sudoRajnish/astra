import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomer, createSession } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/models";

const address = z.object({
  label: z.string().trim().max(40).default("Home"),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+() -]{8,20}$/),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).default(""),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  isDefault: z.boolean().default(false),
});
const input = z.object({
  name: z.string().trim().min(2).max(100),
  addresses: z.array(address).max(10),
  currentPassword: z.string().max(128).optional(),
  newPassword: z.string().min(10).max(128).optional(),
});

export async function PATCH(request: Request) {
  let sessionUser;
  try { sessionUser = await requireCustomer(); }
  catch { return NextResponse.json({ error: "Please sign in again." }, { status: 401 }); }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check your profile details." }, { status: 400 });
  if (Boolean(parsed.data.currentPassword) !== Boolean(parsed.data.newPassword)) return NextResponse.json({ error: "Enter both your current and new password to change it." }, { status: 400 });
  try {
    await connectDb();
    const user = await User.findOne({ _id: sessionUser.id, role: "customer", active: true }).select("+passwordHash name email role sessionVersion");
    if (!user) return NextResponse.json({ error: "Your account is unavailable." }, { status: 401 });
    if (parsed.data.newPassword && !(await bcrypt.compare(parsed.data.currentPassword!, user.passwordHash))) return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    const addresses = parsed.data.addresses.map((item, index, all) => ({ ...item, isDefault: all.some((candidate) => candidate.isDefault) ? item.isDefault : index === 0 }));
    user.name = parsed.data.name;
    user.addresses = addresses;
    if (parsed.data.newPassword) {
      user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
      user.sessionVersion = (user.sessionVersion || 0) + 1;
    }
    await user.save();
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion });
    return NextResponse.json({ ok: true, message: "Your account details have been saved." });
  } catch (error) {
    console.error("Account profile update failed", error);
    return NextResponse.json({ error: "Unable to save your account details right now." }, { status: 503 });
  }
}
