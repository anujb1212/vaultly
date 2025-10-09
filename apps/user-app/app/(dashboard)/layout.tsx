import { AppbarClient } from "../../components/AppbarClient";
import { SidebarItem } from "../../components/SidebarItem";

export default function Layout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="min-h-screen bg-[#181B31] flex flex-col">
      <AppbarClient />
      <div className="flex flex-1 w-full relative">
        {/* Sidebar */}
        <aside className="h-[calc(100vh-64px)] w-60 bg-[#232746] border-r border-[#30324a] fixed left-0 top-16 z-30 flex flex-col gap-1 py-8">
          <nav className="flex flex-col gap-1">
            <SidebarItem href="/dashboard" icon={<HomeIcon />} title="Home" />
            <SidebarItem href="/transfer" icon={<TransferIcon />} title="Transfer" />
            <SidebarItem href="/transactions" icon={<TransactionsIcon />} title="Transactions" />
            <SidebarItem href="/p2ptransfer" icon={<P2PTransferIcon />} title="P2P Transfer" />
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 ml-60 px-10 py-10 bg-[#181B31] min-h-[calc(100vh-64px)]">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 9-9 9 9M4.5 9v12h15V9" />
    </svg>
  );
}
function TransferIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
  );
}
function TransactionsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
  );
}
function P2PTransferIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m-6-6l6 6-6 6" /></svg>
  );
}
