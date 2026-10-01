-- CreateEnum ServiceModule
DO $$ BEGIN
    CREATE TYPE "ServiceModule" AS ENUM (
        'MODULE_CRM',
        'MODULE_QUOTES',
        'MODULE_INVOICES',
        'MODULE_DISPATCH',
        'MODULE_WAREHOUSE',
        'MODULE_CUSTOMER_PORTAL',
        'MODULE_SUPPORT_DESK',
        'MODULE_BLUE_COLLAR_HR',
        'MODULE_FINTECH_WALLETS',
        'MODULE_ENTERPRISE_HQ'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum SubscriptionTier
DO $$ BEGIN
    CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum SubscriptionStatus
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum BillingCycle
DO $$ BEGIN
    CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable SubscriptionPlan
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'GROWTH',
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceAnnual" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxSeats" INTEGER NOT NULL DEFAULT 5,
    "maxTechnicians" INTEGER NOT NULL DEFAULT 10,
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "enabledModules" "ServiceModule"[] NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable TenantSubscription
CREATE TABLE IF NOT EXISTS "TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "customSeatQuota" INTEGER,
    "customTechnicianQuota" INTEGER,
    "customBranchQuota" INTEGER,
    "additionalModules" "ServiceModule"[] DEFAULT ARRAY[]::"ServiceModule"[],
    "disabledModules" "ServiceModule"[] DEFAULT ARRAY[]::"ServiceModule"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TenantSubscription_tenantId_key" ON "TenantSubscription"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TenantSubscription_planId_idx" ON "TenantSubscription"("planId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TenantSubscription_status_idx" ON "TenantSubscription"("status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
