export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startAuditWorker, startSecurityWorker } = await import("@repo/db/client");
        startAuditWorker();
        startSecurityWorker();
    }
}
