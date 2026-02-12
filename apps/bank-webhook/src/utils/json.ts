export function asJsonObject(value: unknown): Record<string, any> {
    if (!value || typeof value !== "object") return {};
    if (Array.isArray(value)) return {};
    return value as any;
}
