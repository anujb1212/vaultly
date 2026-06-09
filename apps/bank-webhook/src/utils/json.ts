export function asJsonObject(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) return {};
    if (typeof value !== "object") return {};
    if (Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}
