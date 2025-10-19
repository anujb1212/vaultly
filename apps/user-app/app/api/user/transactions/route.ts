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

        const userId = Number(session.user.id);

        // Fetch OnRamp transactions
        const onRampTransactions = await prisma.onRampTransaction.findMany({
            where: { userId },
            orderBy: { startTime: "desc" },
            take: 20,
        });

        // Fetch P2P transactions (both sent and received)
        const p2pTransactions = await prisma.p2pTransfer.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            include: {
                sender: { select: { number: true, name: true } },
                receiver: { select: { number: true, name: true } },
            },
            orderBy: { timestamp: "desc" },
            take: 20,
        });

        // Format OnRamp transactions
        const formattedOnRamp = onRampTransactions.map((tx) => ({
            id: tx.id,
            time: tx.startTime,
            amount: tx.amount,
            status: tx.status,
            provider: tx.provider,
        }));

        // Format P2P transactions
        const formattedP2P = p2pTransactions.map((tx) => ({
            id: tx.id,
            time: tx.timestamp,
            amount: tx.amount,
            toUser: tx.senderId === userId ? tx.receiver.number : tx.sender.number,
            type: tx.senderId === userId ? "sent" : "received",
        }));

        return NextResponse.json({
            onRamp: formattedOnRamp,
            p2p: formattedP2P,
        });
    } catch (error) {
        console.error("Transactions fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
