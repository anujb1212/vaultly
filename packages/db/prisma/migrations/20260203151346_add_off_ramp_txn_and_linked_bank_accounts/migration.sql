-- CreateEnum
CREATE TYPE "OffRampStatus" AS ENUM ('Success', 'Failure', 'Processing');

-- CreateEnum
CREATE TYPE "LinkedBankProviderKey" AS ENUM ('HDFC', 'AXIS', 'ICICI', 'SBI', 'KOTAK');

-- AlterEnum
ALTER TYPE "LedgerTxnType" ADD VALUE 'OFFRAMP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SecurityEventType" ADD VALUE 'OFFRAMP_INITIATED';
ALTER TYPE "SecurityEventType" ADD VALUE 'OFFRAMP_COMPLETED';
ALTER TYPE "SecurityEventType" ADD VALUE 'OFFRAMP_FAILED';

-- CreateTable
CREATE TABLE "LinkedBankAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "providerKey" "LinkedBankProviderKey" NOT NULL,
    "displayName" TEXT NOT NULL,
    "maskedAccount" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "locked" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffRampTransaction" (
    "id" SERIAL NOT NULL,
    "status" "OffRampStatus" NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "linkedBankAccountId" INTEGER NOT NULL,
    "providerKey" "LinkedBankProviderKey" NOT NULL,
    "amount" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "failureReason" TEXT,
    "failureReasonCode" TEXT,
    "failureReasonMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),

    CONSTRAINT "OffRampTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedBankAccount_userId_idx" ON "LinkedBankAccount"("userId");

-- CreateIndex
CREATE INDEX "LinkedBankAccount_userId_providerKey_idx" ON "LinkedBankAccount"("userId", "providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedBankAccount_userId_providerKey_key" ON "LinkedBankAccount"("userId", "providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "OffRampTransaction_token_key" ON "OffRampTransaction"("token");

-- CreateIndex
CREATE INDEX "OffRampTransaction_userId_startTime_idx" ON "OffRampTransaction"("userId", "startTime");

-- CreateIndex
CREATE INDEX "OffRampTransaction_linkedBankAccountId_startTime_idx" ON "OffRampTransaction"("linkedBankAccountId", "startTime");

-- CreateIndex
CREATE INDEX "OffRampTransaction_token_idx" ON "OffRampTransaction"("token");

-- AddForeignKey
ALTER TABLE "LinkedBankAccount" ADD CONSTRAINT "LinkedBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffRampTransaction" ADD CONSTRAINT "OffRampTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffRampTransaction" ADD CONSTRAINT "OffRampTransaction_linkedBankAccountId_fkey" FOREIGN KEY ("linkedBankAccountId") REFERENCES "LinkedBankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
