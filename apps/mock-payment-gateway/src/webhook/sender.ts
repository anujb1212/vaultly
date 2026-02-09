import crypto from "crypto";

export async function sendWebhook(args: {
    payload: any;
    secret: string;
    url: string;
    webhookEventId: string;
}): Promise<void> {
    const bodyStr = JSON.stringify(args.payload);
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
        signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} : ${response.statusText}`);
    }

    console.log(
        `[WebhookSender] Webhook delivered: token=${args.payload?.token} id=${args.webhookEventId}`
    );
}
