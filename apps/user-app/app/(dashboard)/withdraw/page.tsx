import { WithdrawWindow } from "../../../components/withdraw/WithdrawWindow";


export default function WithdrawPage() {
    return (
        <div className="w-full max-w-7xl mx-auto pb-20 pt-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                    Withdraw Funds
                </h1>
                <p className="text-slate-500 dark:text-white/60 mt-3 font-medium">
                    Select a linked bank account to transfer funds securely.
                </p>
            </div>
            <WithdrawWindow />
        </div>
    );
}
