"use client";
import { usePathname, useRouter } from "next/navigation";

export const SidebarItem = ({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const selected = pathname === href;

    return (
        <button
            type="button"
            tabIndex={0}
            aria-current={selected ? "page" : undefined}
            aria-label={title}
            onClick={() => router.push(href)}
            className={`flex items-center w-full px-6 py-2.5 rounded-md text-base font-medium gap-4 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selected ? "bg-indigo-700 text-white font-bold" : "text-[#c1c7db] hover:bg-[#292e4a] hover:text-white"
                }`}
            style={{ minHeight: "44px" }}
        >
            <span aria-hidden="true">{icon}</span>
            <span className="flex-1 text-left">{title}</span>
        </button>
    );
};
