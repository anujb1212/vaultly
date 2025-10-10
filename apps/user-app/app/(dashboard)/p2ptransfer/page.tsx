import { SendMoneyCard } from "../../../components/SendMoneyCard";

export default function P2PTransferPage() {
    return (
        <div className="w-full">
            <div className="max-w-sm mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700">
                <div className="px-5 pt-4 pb-2 border-b border-gray-200 dark:border-neutral-700">
                    <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 text-center">
                        Peer-to-Peer Transfer
                    </h1>
                </div>
                <div className="p-5">
                    <SendMoneyCard />
                </div>
            </div>
        </div>
    );
}
