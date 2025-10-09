// import { FaArrowRight } from "react-icons/fa";

// export function TransactionList({ transactions, showViewAll = false }) {
//     return (
//         <div>
//             <div className="flex justify-between items-center mb-2">
//                 <h3 className="font-semibold text-gray-700 text-lg">Recent Transactions</h3>
//                 {showViewAll && (
//                     <a href="/transactions" className="text-blue-600 flex items-center hover:underline">
//                         View all <FaArrowRight className="ml-1" />
//                     </a>
//                 )}
//             </div>

//             <ul className="divide-y divide-gray-200">
//                 {transactions.length === 0 && (
//                     <li className="py-4 text-center text-gray-500 italic">No transactions found.</li>
//                 )}
//                 {transactions.slice(0, showViewAll ? transactions.length : 5).map((tx, idx) => (
//                     <li key={idx} className="flex justify-between py-3 items-center hover:bg-gray-50 rounded px-2">
//                         <div>
//                             <div className="font-medium text-gray-800">{tx.description || "Payment"}</div>
//                             <div className="text-xs text-gray-400">{new Date(tx.time).toLocaleString()}</div>
//                         </div>
//                         <div className={`font-semibold ${tx.status === "Failed" ? "text-red-600" : "text-green-600"}`}>
//                             ₹{tx.amount}
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }
