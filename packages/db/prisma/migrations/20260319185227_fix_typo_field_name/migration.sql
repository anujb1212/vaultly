/*
  Warnings:

  - You are about to drop the `ArbitriumBridgeTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ArbitiumBridgeDirection" AS ENUM ('DEPOSIT', 'WITHDRAW');

-- DropTable
DROP TABLE "ArbitriumBridgeTransaction";

-- DropEnum
DROP TYPE "ArbitriumBridgeDirection";

-- CreateTable
CREATE TABLE "ArbitiumBridgeTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "direction" "ArbitiumBridgeDirection" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArbitiumBridgeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArbitiumBridgeTransaction_idempotencyKey_key" ON "ArbitiumBridgeTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ArbitiumBridgeTransaction_userId_createdAt_idx" ON "ArbitiumBridgeTransaction"("userId", "createdAt");
