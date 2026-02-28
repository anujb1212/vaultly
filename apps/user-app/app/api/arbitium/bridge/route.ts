import { NextRequest, NextResponse } from "next/server";
import prisma from "@repo/db/client";
import { postP2PLedger } from "@repo/db/client";
import { z } from "zod";

const BRIDGE_SECRET = process.env.BRIDGE_SECRET;

const ARBITIUM_SYSTEM_USER_ID = Number(process.env.ARBITIUM_SYSTEM_USER_ID);

const BridgeRequestSchema = z.object({
    vaultlyUserId: z.string().min(1),
    amountInPaise: z.number().int().positive(),
    direction: z.enum(["DEPOSIT", "WITHDRAW"]),
    idempotencyKey: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-bridge-secret");
    if (!BRIDGE_SECRET || secret !== BRIDGE_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = BridgeRequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { vaultlyUserId, amountInPaise, direction, idempotencyKey } = parsed.data;
    const userId = Number(vaultlyUserId);

    if (!Number.isFinite(userId) || userId <= 0) {
        return NextResponse.json({ error: "Invalid vaultlyUserId" }, { status: 400 });
    }

    if (!Number.isFinite(ARBITIUM_SYSTEM_USER_ID) || ARBITIUM_SYSTEM_USER_ID <= 0) {
        return NextResponse.json(
            { error: "ARBITIUM_SYSTEM_USER_ID not configured" },
            { status: 500 }
        );
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.balance.upsert({
                where: { userId },
                update: {},
                create: { userId, amount: 0, locked: 0 },
            });

            await tx.balance.upsert({
                where: { userId: ARBITIUM_SYSTEM_USER_ID },
                update: {},
                create: { userId: ARBITIUM_SYSTEM_USER_ID, amount: 0, locked: 0 },
            });

            const [firstId, secondId] = [userId, ARBITIUM_SYSTEM_USER_ID].sort((a, b) => a - b);
            await tx.$queryRaw`
                SELECT id FROM "Balance"
                WHERE "userId" IN (${firstId}, ${secondId})
                FOR UPDATE
            `;

            const userBalance = await tx.balance.findUnique({ where: { userId } });

            if (direction === "DEPOSIT") {
                if (!userBalance || userBalance.amount < amountInPaise) {
                    throw new Error("INSUFFICIENT_BALANCE");
                }

                await tx.balance.update({
                    where: { userId },
                    data: { amount: { decrement: amountInPaise } },
                });
                await tx.balance.update({
                    where: { userId: ARBITIUM_SYSTEM_USER_ID },
                    data: { amount: { increment: amountInPaise } },
                });
            } else {
                const systemBalance = await tx.balance.findUnique({
                    where: { userId: ARBITIUM_SYSTEM_USER_ID },
                });
                if (!systemBalance || systemBalance.amount < amountInPaise) {
                    throw new Error("INSUFFICIENT_SYSTEM_BALANCE");
                }

                await tx.balance.update({
                    where: { userId: ARBITIUM_SYSTEM_USER_ID },
                    data: { amount: { decrement: amountInPaise } },
                });
                await tx.balance.update({
                    where: { userId },
                    data: { amount: { increment: amountInPaise } },
                });
            }

            await postP2PLedger({
                tx,
                idempotencyKey,
                senderId: direction === "DEPOSIT" ? userId : ARBITIUM_SYSTEM_USER_ID,
                receiverId: direction === "DEPOSIT" ? ARBITIUM_SYSTEM_USER_ID : userId,
                amount: amountInPaise,
            });

            return { success: true };
        }, { timeout: 10000 });

        return NextResponse.json(result);
    } catch (error: any) {
        if (error?.message === "INSUFFICIENT_BALANCE") {
            return NextResponse.json(
                { error: "Insufficient Vaultly balance" },
                { status: 422 }
            );
        }
        console.error("Bridge error:", error);
        return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
    }
}
