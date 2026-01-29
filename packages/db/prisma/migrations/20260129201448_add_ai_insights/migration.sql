-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('SESSION_CREATED', 'LOGIN_FAILED', 'PIN_VERIFY_FAILED', 'PIN_LOCKED', 'P2P_INITIATED', 'P2P_COMPLETED', 'P2P_FAILED', 'ONRAMP_INITIATED', 'ONRAMP_COMPLETED', 'ONRAMP_FAILED', 'EMAIL_ADDED');

-- CreateEnum
CREATE TYPE "SecuritySignalType" AS ENUM ('NEW_DEVICE', 'NEW_SESSION_SPIKE', 'RAPID_PIN_FAILURES', 'LARGE_TRANSFER', 'FIRST_TIME_RECIPIENT', 'RAPID_RETRIES', 'ONRAMP_FAILURES');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AIInsightStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "deviceHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySignal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SecuritySignalType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "eventId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecuritySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISecurityInsight" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "signalId" INTEGER NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" "AIInsightStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISecurityInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_occurredAt_idx" ON "SecurityEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_type_occurredAt_idx" ON "SecurityEvent"("userId", "type", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEvent_source_sourceId_key" ON "SecurityEvent"("source", "sourceId");

-- CreateIndex
CREATE INDEX "SecuritySignal_userId_createdAt_idx" ON "SecuritySignal"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecuritySignal_userId_dedupeKey_key" ON "SecuritySignal"("userId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "AISecurityInsight_signalId_key" ON "AISecurityInsight"("signalId");

-- CreateIndex
CREATE INDEX "AISecurityInsight_userId_createdAt_idx" ON "AISecurityInsight"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AISecurityInsight_userId_status_createdAt_idx" ON "AISecurityInsight"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecuritySignal" ADD CONSTRAINT "SecuritySignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecuritySignal" ADD CONSTRAINT "SecuritySignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SecurityEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISecurityInsight" ADD CONSTRAINT "AISecurityInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISecurityInsight" ADD CONSTRAINT "AISecurityInsight_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "SecuritySignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
