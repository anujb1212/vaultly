import { WithdrawWindow } from "../../../components/withdraw/WithdrawWindow";


export default function WithdrawPage() {
    return (
        <div className="w-full max-w-7xl mx-auto pb-20 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Withdraw Funds
                </h1>
                <p className="text-slate-500 dark:text-neutral-400 mt-2">
                    Select a linked bank account to transfer funds securely.
                </p>
            </div>
            <WithdrawWindow />
        </div>
    );
}
