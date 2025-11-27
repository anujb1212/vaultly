import { PrismaClient } from '@prisma/client'
import { IdempotencyManager } from './src/utils/idempotency'
import { AuditLogger } from './src/utils/auditLogger'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' }
    ]
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma: ReturnType<typeof prismaClientSingleton> = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export const auditLogger = new AuditLogger(prisma);
export { AuditLogger } from './src/utils/auditLogger';
export type { AuditLogEntry, AuditMetadata } from './src/utils/auditLogger';

export const idempotencyManager = new IdempotencyManager(prisma);
export { IdempotencyManager } from './src/utils/idempotency';