import { z } from "zod";

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function toFieldErrors<T extends string>(
    err: z.ZodError<any>
): { fieldErrors: FieldErrors<T>; formError?: string } {
    const flat = err.flatten();
    const fieldErrors: Record<string, string> = {};

    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        if (msgs && msgs.length > 0) fieldErrors[key] = msgs[0]!;
    }

    const formError = flat.formErrors?.[0];
    return { fieldErrors: fieldErrors as FieldErrors<T>, formError };
}
