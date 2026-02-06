export function getBackoffWithJitter(attemptsMade: number): number {
    const exponentialDelay = Math.min(
        1000 * Math.pow(2, attemptsMade),
        3600000
    )

    const jitter = Math.random() * 1000

    return exponentialDelay + jitter
}