export default function AdminDlqLoading() {
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-6 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-80 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>

            <div className="rounded-3xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                        <div className="border-b border-border bg-muted/30 px-4 py-3 flex gap-4">
                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                            <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                        </div>

                        <div className="divide-y divide-border">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="px-4 py-4 flex gap-4 items-center">
                                    <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                                    <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                                    <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                                    <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                                    <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                                    <div className="h-8 w-32 rounded-xl bg-muted animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
