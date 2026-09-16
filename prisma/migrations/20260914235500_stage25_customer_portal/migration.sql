-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'NORMAL', 'URGENT', 'EMERGENCY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "rating" DOUBLE PRECISION DEFAULT 5.0,
ADD COLUMN "jobsCompletedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "urgency" "UrgencyLevel" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "preferredDate" TIMESTAMP(3),
ADD COLUMN "preferredTimeSlot" TEXT,
ADD COLUMN "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
