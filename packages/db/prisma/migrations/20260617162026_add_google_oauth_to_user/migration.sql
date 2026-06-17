/*
  Warnings:

  - You are about to drop the `AISecurityInsight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArbitiumBridgeTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmailVerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IdempotencyKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LedgerAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LedgerEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LedgerTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LinkedBankAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Merchant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OffRampTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OnRampTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecurityEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecuritySignal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionPin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `p2pTransfer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AISecurityInsight" DROP CONSTRAINT "AISecurityInsight_signalId_fkey";

-- DropForeignKey
ALTER TABLE "AISecurityInsight" DROP CONSTRAINT "AISecurityInsight_userId_fkey";

-- DropForeignKey
ALTER TABLE "ArbitiumBridgeTransaction" DROP CONSTRAINT "ArbitiumBridgeTransaction_userId_fkey";

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
ALTER TABLE "OnRampTransaction" DROP CONSTRAINT "OnRampTransaction_linkedBankAccountId_fkey";

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

-- DropTable
DROP TABLE "AISecurityInsight";

-- DropTable
DROP TABLE "ArbitiumBridgeTransaction";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Balance";

-- DropTable
DROP TABLE "EmailVerificationToken";

-- DropTable
DROP TABLE "IdempotencyKey";

-- DropTable
DROP TABLE "LedgerAccount";

-- DropTable
DROP TABLE "LedgerEntry";

-- DropTable
DROP TABLE "LedgerTransaction";

-- DropTable
DROP TABLE "LinkedBankAccount";

-- DropTable
DROP TABLE "Merchant";

-- DropTable
DROP TABLE "OffRampTransaction";

-- DropTable
DROP TABLE "OnRampTransaction";

-- DropTable
DROP TABLE "SecurityEvent";

-- DropTable
DROP TABLE "SecuritySignal";

-- DropTable
DROP TABLE "TransactionPin";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserSession";

-- DropTable
DROP TABLE "p2pTransfer";

-- DropEnum
DROP TYPE "AIInsightStatus";

-- DropEnum
DROP TYPE "ArbitiumBridgeDirection";

-- DropEnum
DROP TYPE "AuthType";

-- DropEnum
DROP TYPE "LedgerAccountType";

-- DropEnum
DROP TYPE "LedgerEntryDirection";

-- DropEnum
DROP TYPE "LedgerTxnType";

-- DropEnum
DROP TYPE "LinkedBankProviderKey";

-- DropEnum
DROP TYPE "OffRampStatus";

-- DropEnum
DROP TYPE "OnRampStatus";

-- DropEnum
DROP TYPE "P2PStatus";

-- DropEnum
DROP TYPE "SecurityEventType";

-- DropEnum
DROP TYPE "SecuritySeverity";

-- DropEnum
DROP TYPE "SecuritySignalType";

-- DropEnum
DROP TYPE "TotpStatus";
