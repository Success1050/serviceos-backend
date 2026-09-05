/*
  Warnings:

  - Added the required column `customerRecordId` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "warrantyDocumentUrl" TEXT,
ADD COLUMN     "warrantyExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "assetId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customerRecordId" TEXT NOT NULL,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ServiceRequest_tenantId_idx" ON "ServiceRequest"("tenantId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerRecordId_fkey" FOREIGN KEY ("customerRecordId") REFERENCES "CustomerRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
