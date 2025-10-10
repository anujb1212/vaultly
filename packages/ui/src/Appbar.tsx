import { Button } from "./button";

interface AppbarProps {
    user?: {
        name?: string | null;
    },
    onSignin: () => void,
    onSignout: () => void
}

export const Appbar = ({
    user,
    onSignin,
    onSignout
}: AppbarProps) => {
    return (
        <div className="flex justify-between items-center border-b px-6 py-2 bg-gradient-to-r from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm">
            <div className="text-3xl tracking-wide font-extrabold rounded-lg px-2 py-1 select-none dark:text-indigo-200">
                VAULTLY
            </div>
            <div className="flex items-center gap-2">
                {user?.name && (
                    <span className="text-base font-medium text-slate-700 dark:text-gray-200 bg-slate-100 dark:bg-gray-800 rounded-full px-3 py-1 shadow-inner mr-2">
                        {user.name}
                    </span>
                )}
                <Button onClick={user ? onSignout : onSignin}>
                    {user ? "Logout" : "Login"}
                </Button>
            </div>
        </div>
    );
};
