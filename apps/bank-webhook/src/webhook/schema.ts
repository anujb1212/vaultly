import z from "zod";

const onrampSchema = z.object({
    type: z.literal("ONRAMP"),
    token: z.string().min(1).max(512),
    user_identifier: z.string().min(1).max(64),
    amount: z.number().int().positive().max(100_000_000_00),
    status: z.enum(["Success", "Failure"]),
    failureReasonCode: z.string().trim().max(64).optional(),
    failureReasonMessage: z.string().trim().max(512).optional(),
});

const offrampSchema = onrampSchema.extend({
    type: z.literal("OFFRAMP"),
    linkedBankAccountId: z.number().int().positive(),
});

export const webhookBodySchema = z.discriminatedUnion("type", [onrampSchema, offrampSchema]);

export type WebhookBody = z.infer<typeof webhookBodySchema>;
export type WebhookType = WebhookBody["type"];
export type WebhookStatus = WebhookBody["status"];
