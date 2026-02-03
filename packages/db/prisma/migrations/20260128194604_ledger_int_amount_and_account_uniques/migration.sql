/*
  Warnings:

  - You are about to alter the column `amount` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - A unique constraint covering the columns `[systemKey]` on the table `LedgerAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LedgerAccount" ADD COLUMN     "systemKey" TEXT;

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_systemKey_key" ON "LedgerAccount"("systemKey");

-- CreateIndex
CREATE INDEX "LedgerAccount_userId_accountType_currency_idx" ON "LedgerAccount"("userId", "accountType", "currency");
