-- DropForeignKey
ALTER TABLE "AISecurityInsight" DROP CONSTRAINT "AISecurityInsight_signalId_fkey";

-- DropForeignKey
ALTER TABLE "AISecurityInsight" DROP CONSTRAINT "AISecurityInsight_userId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailVerificationToken" DROP CONSTRAINT "EmailVerificationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerAccount" DROP CONSTRAINT "LedgerAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_accountId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "LinkedBankAccount" DROP CONSTRAINT "LinkedBankAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "OffRampTransaction" DROP CONSTRAINT "OffRampTransaction_linkedBankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "OffRampTransaction" DROP CONSTRAINT "OffRampTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "OnRampTransaction" DROP CONSTRAINT "OnRampTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityEvent" DROP CONSTRAINT "SecurityEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecuritySignal" DROP CONSTRAINT "SecuritySignal_eventId_fkey";

-- DropForeignKey
ALTER TABLE "SecuritySignal" DROP CONSTRAINT "SecuritySignal_userId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionPin" DROP CONSTRAINT "TransactionPin_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "p2pTransfer" DROP CONSTRAINT "p2pTransfer_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "p2pTransfer" DROP CONSTRAINT "p2pTransfer_senderId_fkey";

-- AlterTable
ALTER TABLE "OnRampTransaction" ADD COLUMN     "linkedBankAccountId" INTEGER;

-- CreateIndex
CREATE INDEX "OnRampTransaction_linkedBankAccountId_idx" ON "OnRampTransaction"("linkedBankAccountId");
