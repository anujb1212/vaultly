import db from "@repo/db/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password, name, email } = body as {
      phone?: string;
      password?: string;
      name?: string;
      email?: string;
    };

    const normalizedEmail =
      typeof email === "string" && email.trim().length > 0
        ? email.trim().toLowerCase()
        : undefined;

    if (!phone || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (normalizedEmail) {
      const existingEmail = await db.user.findFirst({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const existingUser = await db.user.findFirst({
      where: { number: phone },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        number: phone,
        password: hashedPassword,
        name: name || "New User",
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
      select: {
        id: true,
        number: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        number: user.number,
        name: user.name,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Already registered" }, { status: 400 });
    }

    console.error("[signup] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
