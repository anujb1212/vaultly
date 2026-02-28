import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const existingSystemUser = await prisma.user.findUnique({
    where: { number: "0000000000" },
    select: { id: true },
  });

  await prisma.p2pTransfer.deleteMany();
  await prisma.onRampTransaction.deleteMany();
  await prisma.offRampTransaction.deleteMany().catch(() => { });
  await prisma.transactionPin.deleteMany();
  await prisma.linkedBankAccount.deleteMany().catch(() => { });
  await prisma.userSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.ledgerAccount.deleteMany();

  await prisma.balance.deleteMany({
    where: existingSystemUser
      ? { userId: { not: existingSystemUser.id } }
      : {},
  });

  await prisma.user.deleteMany({
    where: { number: { not: "0000000000" } },
  });

  const passwordCost = 10;
  const mpinCost = 12;

  const alicePasswordHash = await bcrypt.hash("alice", passwordCost);
  const bobPasswordHash = await bcrypt.hash("bob", passwordCost);
  const charliePasswordHash = await bcrypt.hash("charlie", passwordCost);
  const aliceMpinHash = await bcrypt.hash("123456", mpinCost);

  const alice = await prisma.user.create({
    data: {
      number: "1111111111",
      password: alicePasswordHash,
      name: "Alice",
      email: "alice@example.com",
      Balance: { create: { amount: 250000, locked: 0 } },
      linkedBankAccounts: {
        create: [
          { providerKey: "HDFC", displayName: "HDFC Bank", maskedAccount: "**** 4821", amount: 419611, locked: 0 },
          { providerKey: "AXIS", displayName: "Axis Bank", maskedAccount: "**** 9923", amount: 1448215, locked: 0 },
          { providerKey: "ICICI", displayName: "ICICI Bank", maskedAccount: "**** 1120", amount: 2240778, locked: 0 },
          { providerKey: "SBI", displayName: "SBI", maskedAccount: "**** 3311", amount: 505623, locked: 0 },
          { providerKey: "KOTAK", displayName: "Kotak Bank", maskedAccount: "**** 8822", amount: 5385773, locked: 0 },
        ],
      },
      transactionPin: {
        create: {
          pinHash: aliceMpinHash,
          algo: "bcrypt",
          version: 1,
          changedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
          lastFailedAt: null,
        },
      },
      OnRampTransaction: {
        create: [
          { startTime: new Date(Date.now() - 1000 * 60 * 60 * 24), status: "Success", amount: 100000, token: "seed_token_alice_1", provider: "HDFC Bank" },
          { startTime: new Date(Date.now() - 1000 * 60 * 60 * 2), status: "Processing", amount: 50000, token: "seed_token_alice_2", provider: "HDFC Bank" },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      number: "2222222222",
      password: bobPasswordHash,
      name: "Bob",
      email: null,
      Balance: { create: { amount: 50000, locked: 0 } },
      linkedBankAccounts: {
        create: [
          { providerKey: "HDFC", displayName: "HDFC Bank", maskedAccount: "**** 7416", amount: 1250430, locked: 0 },
          { providerKey: "AXIS", displayName: "Axis Bank", maskedAccount: "**** 2094", amount: 2034120, locked: 0 },
          { providerKey: "ICICI", displayName: "ICICI Bank", maskedAccount: "**** 5689", amount: 1789550, locked: 0 },
          { providerKey: "SBI", displayName: "SBI", maskedAccount: "**** 7742", amount: 965900, locked: 0 },
          { providerKey: "KOTAK", displayName: "Kotak Bank", maskedAccount: "**** 1308", amount: 3960000, locked: 0 },
        ],
      },
      OnRampTransaction: {
        create: [
          { startTime: new Date(Date.now() - 1000 * 60 * 60 * 20), status: "Failure", amount: 20000, token: "seed_token_bob_1", provider: "HDFC Bank" },
        ],
      },
    },
  });

  const charlie = await prisma.user.create({
    data: {
      number: "3333333333",
      password: charliePasswordHash,
      name: "Charlie",
      email: "charlie@example.com",
      Balance: { create: { amount: 150000, locked: 0 } },
      linkedBankAccounts: {
        create: [
          { providerKey: "HDFC", displayName: "HDFC Bank", maskedAccount: "**** 6159", amount: 842315, locked: 0 },
          { providerKey: "AXIS", displayName: "Axis Bank", maskedAccount: "**** 9841", amount: 3156480, locked: 0 },
          { providerKey: "ICICI", displayName: "ICICI Bank", maskedAccount: "**** 4370", amount: 2045705, locked: 0 },
          { providerKey: "SBI", displayName: "SBI", maskedAccount: "**** 2286", amount: 1127500, locked: 0 },
          { providerKey: "KOTAK", displayName: "Kotak Bank", maskedAccount: "**** 9017", amount: 2828000, locked: 0 },
        ],
      },
    },
  });

  await prisma.p2pTransfer.create({
    data: {
      senderId: alice.id,
      receiverId: bob.id,
      amount: 10000,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: "SUCCESS",
      metadata: { seeded: true, note: "Sample transfer for dev testing" },
    },
  });

  console.log({
    users: [
      { name: "Alice", phone: alice.number, password: "alice", mpin: "123456" },
      { name: "Bob", phone: bob.number, password: "bob", mpin: null },
      { name: "Charlie", phone: charlie.number, password: "charlie", mpin: null },
    ],
  });

  const arbitiumSystemPasswordHash = await bcrypt.hash(crypto.randomUUID(), passwordCost);

  const arbitiumSystem = await prisma.user.upsert({
    where: { number: "0000000000" },
    update: {},
    create: {
      number: "0000000000",
      password: arbitiumSystemPasswordHash,
      name: "Arbitium System",
      email: "system@arbitium.internal",
    },
  });

  await prisma.balance.upsert({
    where: { userId: arbitiumSystem.id },
    update: { amount: { increment: 0 } },
    create: { userId: arbitiumSystem.id, amount: 100_000_000, locked: 0 },
  })
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
