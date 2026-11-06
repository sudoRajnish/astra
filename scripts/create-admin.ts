import bcrypt from "bcryptjs";
import { stdin, stdout } from "node:process";
import mongoose from "mongoose";
import { connectDb } from "../src/lib/db";
import { User } from "../src/models";

async function main() {
  const [emailArg, ...nameParts] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const name = nameParts.join(" ").trim();
  if (!email || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage: npm run admin:create -- admin@example.com 'Admin name'");
  await connectDb();
  if (await User.exists({ role: "super_admin" })) throw new Error("A Super Admin already exists. Use the admin dashboard to manage administrator accounts.");
  if (await User.exists({ email })) throw new Error("That email is already registered. Choose another email address.");
  let password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password) {
    if (!stdin.isTTY) throw new Error("Run this command in an interactive terminal to enter the password securely.");
    const first = await readHidden("Create a Super Admin password (hidden): ");
    const confirm = await readHidden("Confirm password (hidden): ");
    if (first !== confirm) throw new Error("Passwords did not match.");
    password = first;
  }
  if (password.length < 12 || password.length > 128) throw new Error("Password must be between 12 and 128 characters.");
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, role: "super_admin", active: true });
  console.log(`Super Admin created for ${email}. The password was not written to the database in plaintext.`);
}

function readHidden(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") { stdin.setRawMode(false); stdin.off("data", onData); reject(new Error("Cancelled.")); return; }
        if (character === "\r" || character === "\n") { stdin.setRawMode(false); stdin.off("data", onData); stdout.write("\n"); resolve(value); return; }
        if (character === "\u007f" || character === "\b") { value = value.slice(0, -1); continue; }
        value += character;
      }
    };
    stdin.on("data", onData);
  });
}

void main().catch(async (error) => { console.error(error instanceof Error ? error.message : "Admin creation failed."); await mongoose.disconnect(); process.exitCode = 1; });
