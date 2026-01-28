/*
  Warnings:

  - You are about to drop the `BackupCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecurityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSecurity` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('USER_CASH', 'PLATFORM_CLEARING');

-- CreateEnum
CREATE TYPE "LedgerTxnType" AS ENUM ('P2P_TRANSFER', 'ONRAMP', 'REVERSAL');

-- CreateEnum
CREATE TYPE "LedgerEntryDirection" AS ENUM ('DEBIT', 'CREDIT');

-- DropForeignKey
ALTER TABLE "BackupCode" DROP CONSTRAINT "BackupCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityLog" DROP CONSTRAINT "SecurityLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "UserSecurity" DROP CONSTRAINT "UserSecurity_userId_fkey";

-- DropTable
DROP TABLE "BackupCode";

-- DropTable
DROP TABLE "SecurityLog";

-- DropTable
DROP TABLE "UserSecurity";

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "accountType" "LedgerAccountType" NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" SERIAL NOT NULL,
    "type" "LedgerTxnType" NOT NULL,
    "externalRef" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "direction" "LedgerEntryDirection" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerAccount_userId_accountType_idx" ON "LedgerAccount"("userId", "accountType");

-- CreateIndex
CREATE INDEX "LedgerAccount_accountType_currency_idx" ON "LedgerAccount"("accountType", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_externalRef_key" ON "LedgerTransaction"("externalRef");

-- CreateIndex
CREATE INDEX "LedgerTransaction_type_createdAt_idx" ON "LedgerTransaction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_createdAt_idx" ON "LedgerEntry"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
