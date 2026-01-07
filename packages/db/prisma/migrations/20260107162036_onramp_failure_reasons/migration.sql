-- AlterTable
ALTER TABLE "OnRampTransaction" ADD COLUMN     "failureReasonCode" TEXT,
ADD COLUMN     "failureReasonMessage" TEXT;

-- CreateIndex
CREATE INDEX "OnRampTransaction_failureReasonCode_idx" ON "OnRampTransaction"("failureReasonCode");
