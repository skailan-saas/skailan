/*
  Warnings:

  - The primary key for the `LeadTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The primary key for the `ProjectTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `roleInProject` on the `ProjectTeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `issueDate` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `productDescription` on the `QuoteLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `QuoteLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `QuoteLineItem` table. All the data in the column will be lost.
  - You are about to alter the column `unitPrice` on the `QuoteLineItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `relatedToContactId` on the `Task` table. All the data in the column will be lost.
  - The primary key for the `TaskTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `deletedAt` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `lastSignInAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCurrentPeriodEnd` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `QuoteLineItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `ownerId` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "FlowStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_tenantId_assignedToUserId_fkey";

-- DropForeignKey
ALTER TABLE "LeadTag" DROP CONSTRAINT "LeadTag_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTag" DROP CONSTRAINT "ProjectTag_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTeamMember" DROP CONSTRAINT "ProjectTeamMember_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_opportunityId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteLineItem" DROP CONSTRAINT "QuoteLineItem_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_tenantId_assignedToUserId_fkey";

-- DropForeignKey
ALTER TABLE "TaskTag" DROP CONSTRAINT "TaskTag_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_ownerId_fkey";

-- DropIndex
DROP INDEX "Lead_source_idx";

-- DropIndex
DROP INDEX "Lead_status_idx";

-- DropIndex
DROP INDEX "Product_tenantId_category_idx";

-- DropIndex
DROP INDEX "Product_tenantId_type_idx";

-- DropIndex
DROP INDEX "Project_status_idx";

-- DropIndex
DROP INDEX "ProjectTeamMember_projectId_idx";

-- DropIndex
DROP INDEX "ProjectTeamMember_userId_idx";

-- DropIndex
DROP INDEX "Quote_status_idx";

-- DropIndex
DROP INDEX "Task_priority_idx";

-- DropIndex
DROP INDEX "Task_status_idx";

-- DropIndex
DROP INDEX "Tenant_ownerId_key";

-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- DropIndex
DROP INDEX "User_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "channelSpecificId" TEXT;

-- AlterTable
ALTER TABLE "LeadTag" DROP CONSTRAINT "LeadTag_pkey",
ADD CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("leadId", "tagId", "tenantId");

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "ProjectTag" DROP CONSTRAINT "ProjectTag_pkey",
ADD CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("projectId", "tagId", "tenantId");

-- AlterTable
ALTER TABLE "ProjectTeamMember" DROP COLUMN "roleInProject";

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "discountAmount",
DROP COLUMN "issueDate",
DROP COLUMN "subtotal",
DROP COLUMN "taxAmount",
DROP COLUMN "totalAmount",
ADD COLUMN     "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "QuoteLineItem" DROP COLUMN "productDescription",
DROP COLUMN "productName",
DROP COLUMN "total",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "relatedToContactId";

-- AlterTable
ALTER TABLE "TaskTag" DROP CONSTRAINT "TaskTag_pkey",
ADD CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("taskId", "tagId", "tenantId");

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "deletedAt",
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "secondaryColor" TEXT,
ALTER COLUMN "ownerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastSignInAt",
DROP COLUMN "stripeCurrentPeriodEnd",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "hashedPassword" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ChatbotFlow" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "status" "FlowStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastPublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChatbotFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotFlow_tenantId_idx" ON "ChatbotFlow"("tenantId");

-- CreateIndex
CREATE INDEX "Company_tenantId_email_idx" ON "Company"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");

-- CreateIndex
CREATE INDEX "Lead_channelSpecificId_tenantId_idx" ON "Lead"("channelSpecificId", "tenantId");

-- CreateIndex
CREATE INDEX "LeadTag_tenantId_tagId_idx" ON "LeadTag"("tenantId", "tagId");

-- CreateIndex
CREATE INDEX "ProjectTag_tenantId_tagId_idx" ON "ProjectTag"("tenantId", "tagId");

-- CreateIndex
CREATE INDEX "ProjectTeamMember_userId_tenantId_idx" ON "ProjectTeamMember"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "TaskTag_tenantId_tagId_idx" ON "TaskTag"("tenantId", "tagId");

-- CreateIndex
CREATE INDEX "Tenant_ownerId_idx" ON "Tenant"("ownerId");

-- CreateIndex
CREATE INDEX "TenantUser_userId_idx" ON "TenantUser"("userId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_assignedToUserId_fkey" FOREIGN KEY ("tenantId", "assignedToUserId") REFERENCES "TenantUser"("tenantId", "userId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_assignedToUserId_fkey" FOREIGN KEY ("tenantId", "assignedToUserId") REFERENCES "TenantUser"("tenantId", "userId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotFlow" ADD CONSTRAINT "ChatbotFlow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
