-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'PENDING_WEBHOOK', 'NEEDS_ATTENTION', 'ERROR');

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "channelType" "ConversationChannel" NOT NULL,
    "status" "ChannelStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "webhookUrl" TEXT,
    "verifyToken" TEXT,
    "details" TEXT,
    "phoneNumberId" TEXT,
    "phoneNumber" TEXT,
    "wabaId" TEXT,
    "accessToken" TEXT,
    "pageId" TEXT,
    "appSecret" TEXT,
    "botToken" TEXT,
    "apiEndpoint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Channel_tenantId_idx" ON "Channel"("tenantId");

-- CreateIndex
CREATE INDEX "Channel_tenantId_channelType_idx" ON "Channel"("tenantId", "channelType");

-- CreateIndex
CREATE INDEX "Channel_tenantId_status_idx" ON "Channel"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
