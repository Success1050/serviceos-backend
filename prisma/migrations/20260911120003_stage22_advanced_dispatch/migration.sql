-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "enRouteAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDuration" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastKnownLatitude" DOUBLE PRECISION,
ADD COLUMN     "lastKnownLongitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);
