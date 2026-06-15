import { create } from "zustand";

export interface Balance {
    amount: number;
    locked: number;
}

interface OnRampTx {
    id: number;
    time: Date;
    amount: number;
    status: string;
    provider: string;
    failureReasonCode: string | null;
    type: string;
}

interface P2PTx {
    id: number;
    time: Date;
    amount: number;
    toUser: string;
    toUserName: string;
    type: "sent" | "received";
}

interface OffRampTx {
    id: number;
    time: Date;
    amount: number;
    status: string;
    token: string;
    linkedBankAccountId: number;
    providerKey: string;
    displayName: string | null;
    maskedAccount: string | null;
    type: string;
}

interface ArbitiumTx {
    id: number;
    time: Date;
    amount: number;
    direction: "DEPOSIT" | "WITHDRAW";
    idempotencyKey: string;
    type: "arbitium";
}

export interface LinkedAccount {
    id: number;
    providerKey: string;
    displayName: string;
    maskedAccount: string;
    amount: number;
    locked: number;
    updatedAt?: string | Date;
}

interface WalletState {
    balance: Balance;
    onRampTransactions: OnRampTx[];
    p2pTransactions: P2PTx[];
    offRampTransactions: OffRampTx[];
    arbitiumTransactions: ArbitiumTx[];
    linkedAccounts: LinkedAccount[];

    balanceLoading: boolean;
    balanceError: string | null;
    transactionsLoading: boolean;
    transactionsError: string | null;
    linkedAccountsLoading: boolean;
    linkedAccountsError: string | null;

    setBalance: (balance: Balance) => void;
    setBalanceLoading: (loading: boolean) => void;
    setBalanceError: (error: string | null) => void;

    setOnRampTransactions: (txs: OnRampTx[]) => void;
    setP2PTransactions: (txs: P2PTx[]) => void;
    setOffRampTransactions: (txs: OffRampTx[]) => void;
    setArbitiumTransactions: (txs: ArbitiumTx[]) => void;
    setTransactionsLoading: (loading: boolean) => void;
    setTransactionsError: (error: string | null) => void;
    addOptimisticOnRamp: (tx: Partial<OnRampTx>) => void;

    setLinkedAccounts: (accounts: LinkedAccount[]) => void;
    setLinkedAccountsLoading: (loading: boolean) => void;
    setLinkedAccountsError: (error: string | null) => void;

    clearWalletState: () => void;
}

const initialBalance: Balance = { amount: 0, locked: 0 };

export const useWalletStore = create<WalletState>((set, get) => ({
    balance: initialBalance,
    onRampTransactions: [],
    p2pTransactions: [],
    offRampTransactions: [],
    arbitiumTransactions: [],
    linkedAccounts: [],

    balanceLoading: true,
    balanceError: null,
    transactionsLoading: true,
    transactionsError: null,
    linkedAccountsLoading: true,
    linkedAccountsError: null,

    setBalance: (balance) => set({ balance, balanceLoading: false, balanceError: null }),
    setBalanceLoading: (loading) => set({ balanceLoading: loading }),
    setBalanceError: (error) => set({ balanceError: error, balanceLoading: false }),

    setOnRampTransactions: (txs) => set({ onRampTransactions: txs }),
    setP2PTransactions: (txs) => set({ p2pTransactions: txs }),
    setOffRampTransactions: (txs) => set({ offRampTransactions: txs }),
    setArbitiumTransactions: (txs) => set({ arbitiumTransactions: txs }),
    setTransactionsLoading: (loading) => set({ transactionsLoading: loading }),
    setTransactionsError: (error) => set({ transactionsError: error, transactionsLoading: false }),
    addOptimisticOnRamp: (tx) => {
        const current = get().onRampTransactions;
        set({ onRampTransactions: [tx as OnRampTx, ...current] });
    },

    setLinkedAccounts: (accounts) => set({ linkedAccounts: accounts, linkedAccountsLoading: false, linkedAccountsError: null }),
    setLinkedAccountsLoading: (loading) => set({ linkedAccountsLoading: loading }),
    setLinkedAccountsError: (error) => set({ linkedAccountsError: error, linkedAccountsLoading: false }),

    clearWalletState: () =>
        set({
            balance: initialBalance,
            onRampTransactions: [],
            p2pTransactions: [],
            offRampTransactions: [],
            arbitiumTransactions: [],
            linkedAccounts: [],
            balanceLoading: true,
            balanceError: null,
            transactionsLoading: true,
            transactionsError: null,
            linkedAccountsLoading: true,
            linkedAccountsError: null,
        }),
}));
