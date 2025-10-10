import { AppbarClient } from "../../components/AppbarClient";
import { SidebarItem } from "../../components/SidebarItem";

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5.5a1 1 0 01-1-1v-5.5H10.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-10.5z" />
    </svg>
  );
}
function TransferIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}
function TransactionsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v4.25l3 3" />
    </svg>
  );
}
function P2PTransferIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m-6-6l6 6-6 6" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      {/* Fixed Sidebar with gradient skin */}
      <aside
        className="w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-white/40 dark:border-black/30 shadow-sm"
        aria-label="Sidebar navigation"
      >
        <div className="relative h-full">
          {/* Gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/50 to-white/30 dark:from-neutral-900/80 dark:via-neutral-900/70 dark:to-neutral-800/70 backdrop-blur-sm" />
          {/* Content */}
          <div className="relative pt-8 pb-4 px-4">
            <div className="mb-8 text-2xl font-extrabold tracking-tight text-primary-700 dark:text-white select-none">
              VAULTLY
            </div>
            <nav className="flex flex-col gap-1" role="navigation">
              <SidebarItem href="/dashboard" icon={<HomeIcon />} title="Home" />
              <SidebarItem href="/transfer" icon={<TransferIcon />} title="Transfer" />
              <SidebarItem href="/transactions" icon={<TransactionsIcon />} title="Transactions" />
              <SidebarItem href="/p2ptransfer" icon={<P2PTransferIcon />} title="P2P Transfer" />
            </nav>
          </div>
          {/* Subtle edge vignette */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-black/5 dark:bg-white/10" />
        </div>
      </aside>

      {/* Right column: sticky appbar + scrollable content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AppbarClient />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
