-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'DELETED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "whatsappPhoneNumber" TEXT,
ADD COLUMN     "whatsappProfileName" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "templateName" TEXT,
ADD COLUMN     "whatsappMessageId" TEXT,
ADD COLUMN     "whatsappStatus" "WhatsappMessageStatus";

-- CreateTable
CREATE TABLE "WhatsappConfiguration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookVerifyToken" TEXT NOT NULL,
    "displayPhoneNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "businessWebsite" TEXT,
    "businessEmail" TEXT,
    "businessAddress" TEXT,
    "businessVertical" TEXT,
    "messageTemplates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsappConfiguration_tenantId_idx" ON "WhatsappConfiguration"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConfiguration_tenantId_phoneNumberId_key" ON "WhatsappConfiguration"("tenantId", "phoneNumberId");

-- CreateIndex
CREATE INDEX "Conversation_whatsappPhoneNumber_idx" ON "Conversation"("whatsappPhoneNumber");

-- CreateIndex
CREATE INDEX "Message_whatsappMessageId_idx" ON "Message"("whatsappMessageId");

-- AddForeignKey
ALTER TABLE "WhatsappConfiguration" ADD CONSTRAINT "WhatsappConfiguration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
