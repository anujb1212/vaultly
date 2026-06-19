import crypto from "crypto";
import db from "@repo/db/client";

export const LINKED_PROVIDER_ORDER = ["HDFC", "AXIS", "ICICI", "SBI", "KOTAK"] as const;
export type ProviderKey = (typeof LINKED_PROVIDER_ORDER)[number];

export const PROVIDERS: Array<{
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
  const parts = [
    cuts[0]!,
    cuts[1]! - cuts[0]!,
    cuts[2]! - cuts[1]!,
    cuts[3]! - cuts[2]!,
    totalPaise - cuts[3]!,
  ];
  const out = {} as Record<ProviderKey, number>;
  for (let i = 0; i < LINKED_PROVIDER_ORDER.length; i++) {
    out[LINKED_PROVIDER_ORDER[i]!] = parts[i]!;
  }
  return out;
}

export async function seedLinkedAccounts(userId: number, seed: string): Promise<void> {
  const totalSeedPaise = 10_000_000;
  const dist = seededDistribution(totalSeedPaise, seed);

  await db.linkedBankAccount.createMany({
    data: PROVIDERS.map((p) => ({
      userId,
      providerKey: p.providerKey as any,
      displayName: p.displayName,
      maskedAccount: p.maskedAccount,
      amount: dist[p.providerKey],
      locked: 0,
    })),
  });
}

export async function seedBalance(userId: number): Promise<void> {
  await db.balance.create({
    data: { userId, amount: 0, locked: 0 },
  });
}
