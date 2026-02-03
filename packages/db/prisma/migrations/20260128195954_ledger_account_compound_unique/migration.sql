/*
  Warnings:

  - A unique constraint covering the columns `[userId,accountType,currency]` on the table `LedgerAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "LedgerAccount_userId_accountType_currency_idx";

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_userId_accountType_currency_key" ON "LedgerAccount"("userId", "accountType", "currency");
