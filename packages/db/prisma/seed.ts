import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.p2pTransfer.deleteMany();
  await prisma.onRampTransaction.deleteMany();
  await prisma.transactionPin.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.user.deleteMany();

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
          {
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
            status: "Success",
            amount: 100000,
            token: "seed_token_alice_1",
            provider: "HDFC Bank",
          },
          {
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
            status: "Processing",
            amount: 50000,
            token: "seed_token_alice_2",
            provider: "HDFC Bank",
          },
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
      OnRampTransaction: {
        create: [
          {
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 20),
            status: "Failure",
            amount: 20000,
            token: "seed_token_bob_1",
            provider: "HDFC Bank",
          },
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
    },
  });

  await prisma.p2pTransfer.create({
    data: {
      senderId: alice.id,
      receiverId: bob.id,
      amount: 10000,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: "SUCCESS",
      metadata: {
        seeded: true,
        note: "Sample transfer for dev testing",
      },
    },
  });

  console.log({
    users: [
      { name: "Alice", phone: alice.number, password: "alice", mpin: "123456", balancePaise: 250000 },
      { name: "Bob", phone: bob.number, password: "bob", mpin: null, balancePaise: 50000 },
      { name: "Charlie", phone: charlie.number, password: "charlie", mpin: null, balancePaise: 150000 },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
