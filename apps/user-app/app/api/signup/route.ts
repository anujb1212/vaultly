import db from "@repo/db/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { phone, password, name } = body;
  if (!phone || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const existingUser = await db.user.findFirst({ where: { number: phone } });
  if (existingUser) {
    return NextResponse.json({ error: "Already registered" }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      number: phone,
      password: hashedPassword,
      name: name || "New User",
    },
  });
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      number: user.number,
      name: user.name
    }
  });
}

