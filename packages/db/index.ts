import { PrismaClient } from "@prisma/client";
import { IdempotencyManager } from "./src/utils/idempotency";
import { AuditLogger } from "./src/utils/auditLogger";

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return new Proxy(
      {},
      {
        get() {
          throw new Error("Missing DATABASE_URL (set it in runtime env / docker-compose .env)");
        },
      }
    ) as unknown as PrismaClient;
  }

  return new PrismaClient({
    datasources: { db: { url } },
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

function getPrisma() {
  const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
  return prisma;
}

const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const prisma = getPrisma();
      return (prisma as any)[prop];
    },
  }
) as unknown as PrismaClient;

export default db;

export const auditLogger = new AuditLogger(getPrisma());
export { AuditLogger } from './src/utils/auditLogger';
export type { AuditLogEntry, AuditMetadata } from './src/utils/auditLogger';


export const idempotencyManager = new IdempotencyManager(getPrisma());
export { IdempotencyManager } from './src/utils/idempotency';

export * from './src/utils/ledger'