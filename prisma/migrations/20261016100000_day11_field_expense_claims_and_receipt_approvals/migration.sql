-- AlterTable ExpenseReceipt
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "vendor" TEXT;
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "billToClient" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ExpenseReceipt" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExpenseReceipt_tenantId_status_idx" ON "ExpenseReceipt"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ExpenseReceipt_jobId_idx" ON "ExpenseReceipt"("jobId");
CREATE INDEX IF NOT EXISTS "ExpenseReceipt_technicianId_idx" ON "ExpenseReceipt"("technicianId");
