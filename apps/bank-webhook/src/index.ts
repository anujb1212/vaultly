import db, { auditLogger } from "@repo/db/client";
import express from "express";
import zod from "zod";
const app = express();

app.use(express.json())

app.post("/bankWebhook", async (req, res) => {
    const webhookBody = zod.object({
        token: zod.string(),
        user_identifier: zod.string(),
        amount: zod.string()
    })

    const { success } = webhookBody.safeParse(req.body);
    if (!success) {
        return res.status(400).json({
            message: "Invalid request"
        })
    }

    //TODO: HDFC bank should ideally send us a secret so we know this is sent by them
    const paymentInformation: {
        token: string;
        userId: string;
        amount: string
    } = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount
    };

    try {
        const existingTxn = await db.onRampTransaction.findUnique({
            where: {
                token: paymentInformation.token
            }
        })

        if (!existingTxn) {
            return res.status(400).json({
                message: "Transaction not found"
            })
        }

        if (existingTxn.status === "Success") {
            console.log(`[Webhook] Token ${paymentInformation.token} already processed`)
            return res.status(200).json({
                message: "Already Processed"
            })
        }

        await db.$transaction(async (tx) => {
            const userId = Number(paymentInformation.userId)
            const amount = Number(paymentInformation.amount)

            const currentBalance = await tx.balance.findUnique({
                where: { userId }
            })

            if (!currentBalance) {
                throw new Error(`Balance record not found for user ${userId}`)
            }

            const updatedBalance = await tx.balance.update({
                where: { userId },
                data: {
                    amount: {
                        increment: amount
                    }
                }
            })

            await tx.onRampTransaction.update({
                where: {
                    token: paymentInformation.token
                },
                data: {
                    status: "Success",
                    completedAt: new Date(),
                    metadata: {
                        ...(existingTxn.metadata as object),
                        webhookRecivedAt: new Date().toISOString(),
                        webhookPayload: req.body
                    }
                }
            })

            await auditLogger.logBalanceChange(
                userId,
                currentBalance.amount,
                updatedBalance.amount,
                "ONRAMP_CREDIT",
                {
                    token: paymentInformation.token,
                    provider: existingTxn.provider,
                    onRampTxnId: existingTxn.id
                },
                tx
            )

            await auditLogger.createAuditLog({
                userId,
                action: "ONRAMP_COMPLETED",
                entityType: "onRampTransaction",
                entityId: existingTxn.id,
                oldValue: { status: existingTxn.status },
                newValue: {
                    status: "Success",
                    amount,
                    completedAt: new Date()
                },
                metadata: {
                    token: paymentInformation.token,
                    provider: existingTxn.provider
                }
            },
                tx
            )
        })

        console.log(`[Webhook] Successfully processed token: ${paymentInformation.token}`);

        res.json({
            message: "Captured",
        });
    } catch (e: any) {
        console.error("[Webhook] Processing failed:", e);
        res.status(411).json({
            message: "Error while processing webhook",
        });
    }

})

app.listen(3003, () => {
    console.log("[Webhook Server] Running on port 3003")
});