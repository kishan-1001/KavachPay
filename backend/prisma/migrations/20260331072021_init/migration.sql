-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WORKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'PAID', 'REVIEW', 'REJECTED', 'APPEALED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WORKER',
    "city" TEXT NOT NULL,
    "deliveryPlatform" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "weeklyEarnings" INTEGER NOT NULL,
    "upiId" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL,
    "status" "PolicyStatus" NOT NULL,
    "coverageAmount" INTEGER NOT NULL,
    "premiumPaid" INTEGER NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "activeMinutes" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT NOT NULL,
    "ipCity" TEXT,
    "platformActiveFlag" BOOLEAN NOT NULL DEFAULT true,
    "sessionHash" TEXT NOT NULL,
    "previousSessionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHeartbeat" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "WorkHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalEvent" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "alertLevel" TEXT NOT NULL,
    "intensity" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvironmentalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL,
    "fraudScore" DOUBLE PRECISION,
    "workProofScore" DOUBLE PRECISION,
    "behavioralScore" DOUBLE PRECISION,
    "isChainValid" BOOLEAN NOT NULL DEFAULT true,
    "payoutAmount" INTEGER,
    "razorpayPayoutId" TEXT,
    "reviewerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_razorpayOrderId_key" ON "Policy"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_razorpayPaymentId_key" ON "Policy"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Policy_status_userId_idx" ON "Policy"("status", "userId");

-- CreateIndex
CREATE INDEX "WorkSession_userId_startTime_idx" ON "WorkSession"("userId", "startTime" DESC);

-- CreateIndex
CREATE INDEX "WorkHeartbeat_sessionId_idx" ON "WorkHeartbeat"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_razorpayPayoutId_key" ON "Claim"("razorpayPayoutId");

-- CreateIndex
CREATE INDEX "Claim_userId_status_idx" ON "Claim"("userId", "status");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHeartbeat" ADD CONSTRAINT "WorkHeartbeat_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
