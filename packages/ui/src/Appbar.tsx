import { Button } from "./button";

interface AppbarProps {
    user?: {
        name?: string | null;
    };
    onSignin: () => void;
    onSignout: () => void;
}

export const Appbar = ({
    user,
    onSignin,
    onSignout
}: AppbarProps) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 select-none">
                    <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                        <span className="text-white dark:text-black font-bold text-lg">V</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Vaultly
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {user?.name && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                {user.name}
                            </span>
                        </div>
                    )}
                    <Button
                        onClick={user ? onSignout : onSignin}
                        variant={user ? "outline" : "primary"}
                        className="px-6"
                    >
                        {user ? "Log out" : "Sign in"}
                    </Button>
                </div>
            </div>
        </header>
    );
};
