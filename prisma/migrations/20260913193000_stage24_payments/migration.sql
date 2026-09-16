-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('FIXED', 'AUTH_AND_CAPTURE', 'MILESTONE');

-- CreateEnum
CREATE TYPE "PaymentGatewayType" AS ENUM ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE');

-- CreateEnum
CREATE TYPE "EscrowHoldStatus" AS ENUM ('HELD', 'CAPTURED', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "billingType" "BillingType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "termsAndConditions" TEXT,
ADD COLUMN     "signedTermsAt" TIMESTAMP(3),
ADD COLUMN     "signerName" TEXT,
ADD COLUMN     "signerIp" TEXT,
ADD COLUMN     "signatureData" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "paymentHoldStatus" TEXT;

-- CreateTable
CREATE TABLE "QuoteMilestone" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowHold" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT,
    "customerRecordId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "gateway" "PaymentGatewayType" NOT NULL DEFAULT 'STRIPE',
    "gatewayAuthId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "EscrowHoldStatus" NOT NULL DEFAULT 'HELD',
    "expiresAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerRecordId" TEXT,
    "invoiceId" TEXT,
    "gateway" "PaymentGatewayType" NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "gatewayReference" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteMilestone_invoiceId_key" ON "QuoteMilestone"("invoiceId");
CREATE INDEX "QuoteMilestone_tenantId_idx" ON "QuoteMilestone"("tenantId");
CREATE INDEX "QuoteMilestone_quoteId_idx" ON "QuoteMilestone"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowHold_invoiceId_key" ON "EscrowHold"("invoiceId");
CREATE INDEX "EscrowHold_tenantId_idx" ON "EscrowHold"("tenantId");
CREATE INDEX "EscrowHold_jobId_idx" ON "EscrowHold"("jobId");
CREATE INDEX "EscrowHold_customerRecordId_idx" ON "EscrowHold"("customerRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionReference_key" ON "PaymentTransaction"("transactionReference");
CREATE INDEX "PaymentTransaction_tenantId_idx" ON "PaymentTransaction"("tenantId");
CREATE INDEX "PaymentTransaction_transactionReference_idx" ON "PaymentTransaction"("transactionReference");

-- AddForeignKey
ALTER TABLE "QuoteMilestone" ADD CONSTRAINT "QuoteMilestone_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteMilestone" ADD CONSTRAINT "QuoteMilestone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteMilestone" ADD CONSTRAINT "QuoteMilestone_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowHold" ADD CONSTRAINT "EscrowHold_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscrowHold" ADD CONSTRAINT "EscrowHold_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EscrowHold" ADD CONSTRAINT "EscrowHold_customerRecordId_fkey" FOREIGN KEY ("customerRecordId") REFERENCES "CustomerRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscrowHold" ADD CONSTRAINT "EscrowHold_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_customerRecordId_fkey" FOREIGN KEY ("customerRecordId") REFERENCES "CustomerRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
