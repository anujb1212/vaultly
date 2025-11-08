import { Prisma, PrismaClient } from "@prisma/client";

export interface AuditMetadata {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    traceId?: string;
    [key: string]: unknown;
}

export interface AuditLogEntry {
    userId: number;
    action: string;
    entityType: string;
    entityId?: number;
    oldValue?: unknown;
    newValue: unknown;
    metadata?: AuditMetadata;
}

export class AuditLogger {
    constructor(private readonly prisma: PrismaClient) { }

    //Generic Audit Log Creator
    async createAuditLog(entry: AuditLogEntry): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    oldValue: entry.oldValue ?? Prisma.JsonNull,
                    newValue: entry.newValue as Prisma.InputJsonValue,
                    metadata: (entry.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
                }
            })
        } catch (error) {
            console.error('', {
                action: entry.action,
                error: error instanceof Error ? error.message : String(error),
            })
        }
    }

    //Balance Change Logger
    async logBalanceChange(
        userId: number,
        previousBalance: number,
        currentBalance: number,
        changeReason: string,
        additionalMetadata?: AuditMetadata
    ): Promise<void> {
        await this.createAuditLog({
            userId,
            action: 'BALANCE_UPDATED',
            entityType: 'Balance',
            oldValue: {
                amount: previousBalance
            },
            newValue: {
                amount: currentBalance,
                reason: changeReason
            },
            metadata: additionalMetadata,
        })
    }

    //P2P Transfer Logger 
    async logTransfer(
        initiatorUserId: number,
        transferRecordId: number,
        transferDetails: unknown,
        additionalMetadata?: AuditMetadata
    ): Promise<void> {
        await this.createAuditLog({
            userId: initiatorUserId,
            action: 'P2P_TRANSFER_INITIATED',
            entityType: 'p2pTransfer',
            entityId: transferRecordId,
            newValue: transferDetails,
            metadata: additionalMetadata,
        })
    }
}