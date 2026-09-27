-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ProxyVerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_HQ_REVIEW', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "HrDocumentType" AS ENUM ('NATIONAL_ID', 'GOVERNMENT_PHOTO_ID', 'TECH_LIVE_PHOTO', 'TRADE_CERTIFICATION', 'RESUME_CV', 'CONTRACT_DISCLOSURE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isFieldTech" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tradeSpecialty" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customCommissionRate" DECIMAL(5,2);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(10,2);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proxyVerificationStatus" "ProxyVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "managerEndorsementNotes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "managerVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "managerVerifiedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hqReviewNotes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hqReviewedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hqReviewedById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcknowledged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcknowledgedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcknowledgedIp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcknowledgedUserAgent" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT DEFAULT 'v1.0-2026';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agreedCommissionSnapshot" DECIMAL(5,2);

-- CreateTable
CREATE TABLE IF NOT EXISTS "HrDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "HrDocumentType" NOT NULL DEFAULT 'GOVERNMENT_PHOTO_ID',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "notes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_tenantId_isFieldTech_idx" ON "User"("tenantId", "isFieldTech");
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");

CREATE INDEX IF NOT EXISTS "HrDocument_tenantId_idx" ON "HrDocument"("tenantId");
CREATE INDEX IF NOT EXISTS "HrDocument_userId_idx" ON "HrDocument"("userId");
CREATE INDEX IF NOT EXISTS "HrDocument_documentType_idx" ON "HrDocument"("documentType");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_managerVerifiedById_fkey" FOREIGN KEY ("managerVerifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_hqReviewedById_fkey" FOREIGN KEY ("hqReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "HrDocument" ADD CONSTRAINT "HrDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "HrDocument" ADD CONSTRAINT "HrDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "HrDocument" ADD CONSTRAINT "HrDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "HrDocument" ADD CONSTRAINT "HrDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
