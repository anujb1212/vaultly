export function getBackoffWithJitter(
    attemptsMade: number,
    _type?: string,
    err?: Error
): number {
    if (err?.message?.includes("HTTP 429")) {
        const base = 30_000 * (attemptsMade + 1)
        return Math.min(base, 3_00_000)
    }

    const exponentialDelay = Math.min(
        1000 * Math.pow(2, attemptsMade),
        36_00000
    )

    const jitter = Math.random() * exponentialDelay * 0.25

    return exponentialDelay + jitter
}