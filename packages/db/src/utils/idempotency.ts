import { Prisma, PrismaClient } from "@prisma/client";

export class IdempotencyManager {
    constructor(private readonly prisma: PrismaClient) { }

    async checkAndStore(
        key: string,
        userId: number,
        action: string,
        ttlHours: number = 24
    ): Promise<{ exists: boolean; response?: unknown } | void> {
        const existingRecord = await this.prisma.idempotencyKey.findUnique({
            where: { key }
        })

        if (existingRecord) {
            if (new Date() < existingRecord.expiresAt) {
                return {
                    exists: true,
                    response: existingRecord.response
                }
            } else {
                await this.prisma.idempotencyKey.delete({ where: { key } })
            }
        }

        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + ttlHours)

        await this.prisma.idempotencyKey.create({
            data: {
                key,
                userId,
                action,
                response: Prisma.JsonNull,
                expiresAt
            }
        })

        return {
            exists: false
        }
    }

    async updateResponse(key: string, response: unknown): Promise<void> {
        await this.prisma.idempotencyKey.update({
            where: { key },
            data: {
                response: response as Prisma.InputJsonValue
            }
        })
    }

    async cleanup(): Promise<number> {
        const result = await this.prisma.idempotencyKey.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        })

        return result.count
    }
}