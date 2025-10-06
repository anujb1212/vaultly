import prisma from "@repo/db/client";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

async function getBalance() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return {
            amount: 0,
            locked: 0
        };
    }
    const balance = await prisma.balance.findFirst({
        where: {
            userId: Number(session?.user?.id)
        }
    });
    return {
        amount: balance?.amount || 0,
        locked: balance?.locked || 0
    }
}

async function getOnRampTransactions() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return [];
    }
    const txns = await prisma.onRampTransaction.findMany({
        where: {
            userId: Number(session?.user?.id)
        }
    });
    return txns.map(t => ({
        time: t.startTime,
        amount: t.amount,
        status: t.status,
        provider: t.provider
    }))
}

export default async function TransferPage() {
    const balance = await getBalance();
    const transactions = await getOnRampTransactions();

    return (
        <div className="min-h-screen bg-gray-50 w-full p-8">
            {/* Title */}
            <div className="text-4xl font-bold mb-8 text-[#6a51a6]">Transfer</div>

            {/* Main widget area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Left: Add Money */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Funds</h2>
                    <AddMoney />
                </div>

                {/* Right: Balance and Transactions */}
                <div className="flex flex-col space-y-6">
                    {/* Balance */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <BalanceCard amount={balance.amount} locked={balance.locked} />
                    </div>
                    {/* Transactions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent On-Ramp Transactions</h2>
                        <OnRampTransactions transactions={transactions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
