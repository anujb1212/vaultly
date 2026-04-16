import type { FailureClass } from "../bullmq/jobTypes";

export function classifyError(error: unknown): FailureClass {
    if (!(error instanceof Error)) return "unknown"

    const msg = error.message
    const code = (error as NodeJS.ErrnoException).code

    if (error.name === "AbortError") return "transient"
    if (code === "ECONNREFUSED") return "transient"
    if (code === "ETIMEDOUT") return "transient"
    if (code === "ECONNRESET") return "transient"
    if (code === "EAI_AGAIN") return "transient"

    if (msg.startsWith("HTTP ")) {
        const parts = msg.split(" ")
        const status = Number(parts[1])

        if (status === 429) return "transient"
        if (status >= 500 && status <= 599) return "transient"
        if (status >= 400 && status <= 499) return "permanent"
    }

    return "unknown"
}

export function isTransientError(error: unknown): boolean {
    return classifyError(error) === "transient"
}