/*
  Warnings:

  - You are about to drop the column `notifications` on the `TenantSettings` table. All the data in the column will be lost.
  - You are about to drop the column `scheduling` on the `TenantSettings` table. All the data in the column will be lost.
  - You are about to drop the column `technicians` on the `TenantSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "TenantSettings" DROP COLUMN "notifications",
DROP COLUMN "scheduling",
DROP COLUMN "technicians",
ADD COLUMN     "lockedSettings" JSONB;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
