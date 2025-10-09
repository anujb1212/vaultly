import { AddMoney } from "./AddMoneyCard";

export function AddMoneyWidget() {
    return (
        <div className="bg-white rounded-xl shadow p-6 flex flex-col space-y-4">
            <h3 className="font-semibold text-gray-700 mb-1 text-lg">Add Funds</h3>
            <AddMoney />
        </div>
    );
}
