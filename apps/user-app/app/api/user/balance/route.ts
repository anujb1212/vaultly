import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "@repo/db/client";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const balance = await prisma.balance.findUnique({
            where: { userId: Number(session.user.id) },
        });

        // If no balance record exists, create one
        if (!balance) {
            const newBalance = await prisma.balance.create({
                data: {
                    userId: Number(session.user.id),
                    amount: 0,
                    locked: 0,
                },
            });

            return NextResponse.json({
                balance: {
                    amount: newBalance.amount,
                    locked: newBalance.locked,
                },
            });
        }

        return NextResponse.json({
            balance: {
                amount: balance.amount,
                locked: balance.locked,
            },
        });
    } catch (error) {
        console.error("Balance fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch balance" },
            { status: 500 }
        );
    }
}
