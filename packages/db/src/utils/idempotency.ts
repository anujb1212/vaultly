import { Prisma, PrismaClient } from "@prisma/client";

export class IdempotencyManager {
    constructor(private readonly prisma: PrismaClient) { }

    async checkAndStore(
        key: string,
        userId: number,
        action: string,
        ttlHours: number = 24,
        txClient?: Prisma.TransactionClient
    ): Promise<{ exists: boolean; response?: unknown }> {
        const client = txClient ?? this.prisma;

        const mkExpiresAt = () => {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + ttlHours);
            return expiresAt;
        };


        try {
            await client.idempotencyKey.create({
                data: {
                    key,
                    userId,
                    action,
                    response: Prisma.JsonNull,
                    expiresAt: mkExpiresAt(),
                },
            });
            return { exists: false };
        } catch (err) {

            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                const existing = await client.idempotencyKey.findUnique({ where: { key } });

                if (!existing) return { exists: false };

                if (new Date() >= existing.expiresAt) {
                    await client.idempotencyKey.upsert({
                        where: { key },
                        update: {
                            userId,
                            action,
                            response: Prisma.JsonNull,
                            expiresAt: mkExpiresAt(),
                        },
                        create: {
                            key,
                            userId,
                            action,
                            response: Prisma.JsonNull,
                            expiresAt: mkExpiresAt(),
                        },
                    });
                    return { exists: false };
                }

                if (existing.response === null) return { exists: false };

                return { exists: true, response: existing.response };
            }
            throw err;
        }
    }

    async updateResponse(
        key: string,
        response: unknown,
        txClient?: Prisma.TransactionClient
    ): Promise<void> {
        const client = txClient ?? this.prisma;
        await client.idempotencyKey.update({
            where: { key },
            data: { response: response as Prisma.InputJsonValue },
        });
    }

    async cleanup(): Promise<number> {
        const result = await this.prisma.idempotencyKey.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });

        return result.count;
    }
}
