import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

// Sign up with email + password. Login itself is handled by Auth.js
// (POST /api/auth/callback/credentials); this route only creates the account.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email or password." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { email, password: passwordHash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
