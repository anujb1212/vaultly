import z from "zod";

export const webhookBodySchema = z.object({
    type: z.enum(["ONRAMP", "OFFRAMP"]),
    token: z.string().min(1),
    user_identifier: z.string().min(1),
    amount: z.coerce.number().int().positive(),
    status: z.enum(["Success", "Failure"]),
    failureReasonCode: z.string().optional(),
    failureReasonMessage: z.string().optional(),

    // OFFRAMP only
    linkedBankAccountId: z.coerce.number().int().positive().optional(),
});

export type WebhookBody = z.infer<typeof webhookBodySchema>;
export type WebhookType = WebhookBody["type"];
export type WebhookStatus = WebhookBody["status"];
