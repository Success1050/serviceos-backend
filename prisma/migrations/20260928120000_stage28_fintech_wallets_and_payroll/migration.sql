-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "WalletType" AS ENUM ('HQ', 'BRANCH', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'FROZEN', 'RESTRICTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "WalletTransactionCategory" AS ENUM (
        'JOB_SETTLEMENT',
        'ROYALTY_SPLIT',
        'COMMISSION_EARNED',
        'PAYOUT_REQUEST',
        'PAYOUT_SETTLED',
        'PAYOUT_REVERSED',
        'EXPENSE_REIMBURSEMENT',
        'MANUAL_ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'SUCCESSFUL', 'REJECTED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable TenantSettings
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "franchiseRoyaltyRate" DECIMAL(5,2);
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "royaltyType" TEXT DEFAULT 'PERCENTAGE';

-- AlterTable Job
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "splitSettled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "splitSettledAt" TIMESTAMP(3);

-- CreateTable Wallet
CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "ledgerBalance" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "lockedBalance" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable StaffBankDetail
CREATE TABLE IF NOT EXISTS "StaffBankDetail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "recipientCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffBankDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable PayoutRequest
CREATE TABLE IF NOT EXISTS "PayoutRequest" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankDetailId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reference" TEXT NOT NULL,
    "transferCode" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "failureReason" TEXT,
    "settledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable WalletTransaction
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "category" "WalletTransactionCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balanceBefore" DECIMAL(14,2) NOT NULL,
    "balanceAfter" DECIMAL(14,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jobId" TEXT,
    "invoiceId" TEXT,
    "payoutRequestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- Unique & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_userId_key" ON "Wallet"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_tenant_wallet_type" ON "Wallet"("tenantId", "type");
CREATE INDEX IF NOT EXISTS "Wallet_tenantId_idx" ON "Wallet"("tenantId");
CREATE INDEX IF NOT EXISTS "Wallet_status_idx" ON "Wallet"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "StaffBankDetail_userId_accountNumber_bankCode_key" ON "StaffBankDetail"("userId", "accountNumber", "bankCode");
CREATE INDEX IF NOT EXISTS "StaffBankDetail_userId_idx" ON "StaffBankDetail"("userId");
CREATE INDEX IF NOT EXISTS "StaffBankDetail_tenantId_idx" ON "StaffBankDetail"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "PayoutRequest_reference_key" ON "PayoutRequest"("reference");
CREATE INDEX IF NOT EXISTS "PayoutRequest_tenantId_status_idx" ON "PayoutRequest"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "PayoutRequest_userId_idx" ON "PayoutRequest"("userId");
CREATE INDEX IF NOT EXISTS "PayoutRequest_walletId_idx" ON "PayoutRequest"("walletId");

CREATE UNIQUE INDEX IF NOT EXISTS "WalletTransaction_reference_key" ON "WalletTransaction"("reference");
CREATE INDEX IF NOT EXISTS "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");
CREATE INDEX IF NOT EXISTS "WalletTransaction_jobId_idx" ON "WalletTransaction"("jobId");
CREATE INDEX IF NOT EXISTS "WalletTransaction_category_idx" ON "WalletTransaction"("category");

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "StaffBankDetail" ADD CONSTRAINT "StaffBankDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "StaffBankDetail" ADD CONSTRAINT "StaffBankDetail_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_bankDetailId_fkey" FOREIGN KEY ("bankDetailId") REFERENCES "StaffBankDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "PayoutRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
