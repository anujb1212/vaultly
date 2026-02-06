export function isTransientError(error: any): boolean {
    const msg = String(error?.message ?? "");
    return (
        error?.name === "AbortError" ||
        error?.code === "ECONNREFUSED" ||
        error?.code === "ETIMEOUT" ||
        msg.includes("HTTP 429") ||
        msg.includes("HTTP 5")
    );
}