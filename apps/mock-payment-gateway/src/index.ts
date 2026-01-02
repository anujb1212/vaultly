import express from 'express';
import { getDLQJobs, queueWebhook } from './webhookSender';
import { z } from "zod";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    })
);


app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const WEBHOOK_URL = process.env.WEBHOOK_URL ?? 'http://localhost:3003/bankWebhook'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'dev_secret'

const PaymentRequestSchema = z.object({
    token: z.string().min(1),
    user_identifier: z.string().min(1),
    amount: z.number().positive(),
    scenario: z.
        enum(['success', 'failure', 'chaos-slow', 'chaos-duplicate', 'chaos-race']).
        optional()
})

type PaymentRequest = z.infer<typeof PaymentRequestSchema>

app.post('/api/process-payment', async (req, res) => {

    const parsed = PaymentRequestSchema.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({
            message: "INVALID_REQUEST",
            issue: parsed.error.issues
        })
    }

    const payload: PaymentRequest = parsed.data

    try {
        await queueWebhook(payload, WEBHOOK_SECRET, WEBHOOK_URL)

        return res.status(202).json({
            queued: true,
            token: payload.token,
            status: 'PENDING_WEBHOOK'
        })

    } catch (err: any) {
        //503 is redis down / queue add failure
        return res.status(503).json({
            error: 'QUEUE_UNAVAILABLE',
            message: err?.message ?? 'Failed to enqueue webhook',
        })
    }
})

app.get('/api/admin/dlq', async (_req, res) => {
    const jobs = await getDLQJobs()

    return res.json({
        count: jobs.length,
        jobs
    })
})

app.listen(3004, () => {
    console.log('Mock Gateway running on http://localhost:3004');
});
