import crypto from "crypto";
import { WebhookPayload } from "../bullmq/jobTypes";

const WEBHOOK_TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS ?? 10_000)

export async function sendWebhook(args: {
    payload: WebhookPayload;
    secret: string;
    url: string;
    webhookEventId: string;
}): Promise<void> {
    let bodyStr: string;
    try {
        bodyStr = JSON.stringify(args.payload);
    } catch (e) {
        throw new Error(`PAYLOAD_SERIALIZATION_FAILED: ${(e as Error).message}`);
    }

    const signature = crypto
        .createHmac("sha256", args.secret)
        .update(bodyStr)
        .digest("hex");

    const response = await fetch(args.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Id": args.webhookEventId,
            "X-Webhook-Timestamp": Date.now().toString(),
        },
        body: bodyStr,
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!response.ok) {
        let errorBody = "";
        try {
            errorBody = await response.text()
        } catch { /* ignore */ }
        throw new Error(
            `HTTP ${response.status} : ${response.statusText}` +
            (errorBody ? ` | body=${errorBody.slice(0, 200)}` : "")
        )
    }

    console.log(JSON.stringify({
        level: "info",
        event: "webhook_delivered",
        type: args.payload.type,
        token: args.payload.token,
        webhookEventId: args.webhookEventId,
    }))
}
