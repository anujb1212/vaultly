import { FaWallet, FaArrowCircleRight, FaUserCircle, FaBell } from "react-icons/fa";

export default function Dashboard() {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="relative">
                        <FaBell className="text-2xl text-gray-700" />
                        {/* Notification badge */}
                        <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-red-500"></span>
                    </button>
                    <FaUserCircle className="text-3xl text-gray-700" />
                </div>
            </div>

            {/* Balance & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Widget */}
                <div className="bg-white rounded-lg p-6 shadow flex flex-col">
                    <span className="font-semibold text-gray-500 mb-1">Total Balance</span>
                    <span className="text-3xl font-bold text-green-700 flex items-center">
                        <FaWallet className="mr-2" /> ₹25,000
                    </span>
                    <span className="text-xs text-gray-400 mt-2">Linked: ICICI Bank ••••2509</span>
                </div>
                {/* Quick Actions */}
                <div className="bg-white rounded-lg p-6 shadow flex flex-col space-y-4">
                    <span className="font-semibold text-gray-500 mb-2">Quick Actions</span>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">Add Money</button>
                        <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700">Send Money</button>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Request</button>
                        <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700">Generate QR</button>
                    </div>
                </div>
                {/* Spending Analytics */}
                <div className="bg-white rounded-lg p-6 shadow flex flex-col">
                    <span className="font-semibold text-gray-500 mb-2">This Month's Spend</span>
                    {/* Replace below div with actual chart */}
                    <div className="h-28 flex items-center justify-center">
                        {/* Chart (use any React chart lib, placeholder for now) */}
                        <div className="rounded-full bg-blue-100 w-24 h-24 flex items-center justify-center text-xl text-blue-700">₹9,430</div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions & Upcoming Bills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="md:col-span-2 bg-white rounded-lg p-6 shadow">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">Recent Transactions</span>
                        <a href="/transactions" className="text-sm text-blue-600 flex items-center">
                            View all <FaArrowCircleRight className="ml-1" />
                        </a>
                    </div>
                    <ul className="divide-y divide-gray-100">
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
                {/* Upcoming Bills */}
                <div className="bg-white rounded-lg p-6 shadow">
                    <span className="font-semibold text-gray-700">Upcoming Bills</span>
                    <ul className="mt-4 space-y-2">
                        <li className="flex justify-between text-sm">
                            <span>Netflix Subscription</span>
                            <span className="font-semibold text-gray-500">₹499</span>
                        </li>
                        <li className="flex justify-between text-sm">
                            <span>Electricity Bill</span>
                            <span className="font-semibold text-gray-500">₹1200</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
