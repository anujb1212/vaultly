import prisma from "@repo/db/client";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

async function getBalance() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { amount: 0, locked: 0 };
    const balance = await prisma.balance.findFirst({
        where: { userId: Number(session?.user?.id) }
    });
    return { amount: balance?.amount || 0, locked: balance?.locked || 0 };
}

async function getOnRampTransactions() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];
    const txns = await prisma.onRampTransaction.findMany({
        where: { userId: Number(session?.user?.id) }
    });
    return txns.map(t => ({
        time: t.startTime,
        amount: t.amount,
        status: t.status,
        provider: t.provider
    }));
}

export default async function TransferPage() {
    const balance = await getBalance();
    const transactions = await getOnRampTransactions();

    return (
        <div className="min-h-screen p-8 max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-extrabold text-primary-700 dark:text-primary-200 tracking-tight">
                    Transfer Funds
                </h1>
                <span className="inline-flex px-4 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold shadow">
                    Instant & Secure
                </span>
            </header>

            <main className="grid md:grid-cols-3 gap-8">
                {/* Add Money */}
                <section className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 flex flex-col">
                    <AddMoney />
                </section>

                {/* Balance + Transactions */}
                <section className="md:col-span-2 flex flex-col gap-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6">
                        <BalanceCard amount={balance.amount} locked={balance.locked} />
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6">
                        <OnRampTransactions transactions={transactions} />
                    </div>
                </section>
            </main>
        </div>
    );
}
