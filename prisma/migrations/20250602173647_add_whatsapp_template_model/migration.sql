/*
  Warnings:

  - You are about to drop the column `messageTemplates` on the `WhatsappConfiguration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WhatsappConfiguration" DROP COLUMN "messageTemplates";

-- CreateTable
CREATE TABLE "WhatsappTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsappTemplate_tenantId_idx" ON "WhatsappTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_status_idx" ON "WhatsappTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappTemplate_tenantId_name_language_key" ON "WhatsappTemplate"("tenantId", "name", "language");

-- AddForeignKey
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
