import db from "@repo/db/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

const LINKED_PROVIDER_ORDER = ["HDFC", "AXIS", "ICICI", "SBI", "KOTAK"] as const;
type ProviderKey = (typeof LINKED_PROVIDER_ORDER)[number];

const PROVIDERS: Array<{
  providerKey: ProviderKey;
  displayName: string;
  maskedAccount: string;
}> = [
    { providerKey: "HDFC", displayName: "HDFC Bank", maskedAccount: "**** 4821" },
    { providerKey: "AXIS", displayName: "Axis Bank", maskedAccount: "**** 9923" },
    { providerKey: "ICICI", displayName: "ICICI Bank", maskedAccount: "**** 1120" },
    { providerKey: "SBI", displayName: "SBI", maskedAccount: "**** 3311" },
    { providerKey: "KOTAK", displayName: "Kotak Bank", maskedAccount: "**** 8822" },
  ];

function seededDistribution(totalPaise: number, seed: string): Record<ProviderKey, number> {
  const h = crypto.createHash("sha256").update(seed).digest();
  const cuts: number[] = [];
  for (let i = 0; i < 4; i++) {
    const n = h.readUInt32BE(i * 4) % (totalPaise - 1);
    cuts.push(1 + n);
  }
  cuts.sort((a, b) => a - b);
  const parts = [cuts[0]!, cuts[1]! - cuts[0]!, cuts[2]! - cuts[1]!, cuts[3]! - cuts[2]!, totalPaise - cuts[3]!];
  const out = {} as Record<ProviderKey, number>;
  for (let i = 0; i < LINKED_PROVIDER_ORDER.length; i++) {
    out[LINKED_PROVIDER_ORDER[i]!] = parts[i]!;
  }
  return out;
}

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

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          number: phone,
          password: hashedPassword,
          name: name || "New User",
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
        },
        select: { id: true, number: true, name: true },
      });

      await tx.balance.create({
        data: { userId: created.id, amount: 0, locked: 0 },
      });

      const totalSeedPaise = 10_000_000; //Rs 1L
      const dist = seededDistribution(totalSeedPaise, `linked-accounts:${created.number}:${created.id}`);

      await tx.linkedBankAccount.createMany({
        data: PROVIDERS.map((p) => ({
          userId: created.id,
          providerKey: p.providerKey as any,
          displayName: p.displayName,
          maskedAccount: p.maskedAccount,
          amount: dist[p.providerKey],
          locked: 0,
        })),
      });

      return created;
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
