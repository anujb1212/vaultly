-- CreateEnum
CREATE TYPE "ArbitriumBridgeDirection" AS ENUM ('DEPOSIT', 'WITHDRAW');

-- CreateTable
CREATE TABLE "ArbitriumBridgeTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "direction" "ArbitriumBridgeDirection" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArbitriumBridgeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArbitriumBridgeTransaction_idempotencyKey_key" ON "ArbitriumBridgeTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ArbitriumBridgeTransaction_userId_createdAt_idx" ON "ArbitriumBridgeTransaction"("userId", "createdAt");
