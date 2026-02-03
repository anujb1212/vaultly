import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "@repo/db/client";
import { NextResponse } from "next/server";

const ORDER = ["HDFC", "AXIS", "ICICI", "SBI", "KOTAK"] as const;
const orderIndex = new Map<string, number>(ORDER.map((k, i) => [k, i]));

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = Number(session.user.id);

        const rows = await prisma.linkedBankAccount.findMany({
            where: { userId },
            select: {
                id: true,
                providerKey: true,
                displayName: true,
                maskedAccount: true,
                amount: true,
                locked: true,
                updatedAt: true,
            },
        });

        rows.sort((a, b) => (orderIndex.get(String(a.providerKey)) ?? 999) - (orderIndex.get(String(b.providerKey)) ?? 999));

        return NextResponse.json({ linkedAccounts: rows });
    } catch (error) {
        console.error("Linked accounts fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch linked accounts" }, { status: 500 });
    }
}
