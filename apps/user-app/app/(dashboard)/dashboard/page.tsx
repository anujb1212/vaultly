// user-app/app/(dashboard)/dashboard/page.tsx
import { FaArrowCircleRight, FaWallet } from "react-icons/fa";

export default function Dashboard() {
    return (
        <div className="py-2">
            {/* Top Bar */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-primary-900 dark:text-white mb-1">Dashboard</h1>
                <p className="text-base text-gray-500 dark:text-gray-300">Welcome back</p>
            </div>

            {/* Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Widget */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-6 flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold mb-1">Total Balance</span>
                    <span className="text-3xl font-bold text-green-600 flex items-center">
                        <FaWallet className="mr-2" /> ₹25,000
                    </span>
                    <span className="text-xs text-gray-400 mt-2">Linked: ICICI Bank ••••2509</span>
                </div>
                {/* Quick Actions */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-6 flex flex-col gap-4">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold mb-2">Quick Actions</span>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow font-semibold transition">Add Money</button>
                        <button className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow font-semibold transition">Send Money</button>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition">Request</button>
                        <button className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow font-semibold transition">Generate QR</button>
                    </div>
                </div>
                {/* Spending Analytics */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-6 flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold mb-2">This Month's Spend</span>
                    <div className="h-28 flex items-center justify-center">
                        {/* Chart placeholder */}
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-24 h-24 flex items-center justify-center text-xl text-blue-700 dark:text-blue-300">₹9,430</div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl shadow p-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Recent Transactions</span>
                        <a href="/transactions" className="text-sm text-primary-600 flex items-center hover:underline">
                            View all <FaArrowCircleRight className="ml-1" />
                        </a>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-neutral-700">
                        {[
                            { desc: "Sent to Ravi Verma", amt: "₹500", date: "Today", type: "debit" },
                            { desc: "Received from Flipkart", amt: "₹1200", date: "Yesterday", type: "credit" },
                            { desc: "Added via bank", amt: "₹2000", date: "2 Oct", type: "credit" }
                        ].map((tx, idx) => (
                            <li className="flex justify-between py-3 items-center" key={idx}>
                                <div>
                                    <span className="block font-medium">{tx.desc}</span>
                                    <span className="block text-xs text-gray-400">{tx.date}</span>
                                </div>
                                <span className={`text-lg font-bold ${tx.type === "debit" ? "text-red-600" : "text-green-600"}`}>
                                    {tx.amt}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
