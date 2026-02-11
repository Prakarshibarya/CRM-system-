/*
  Warnings:

  - You are about to drop the `CRMItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CRMItem" DROP CONSTRAINT "CRMItem_organizerId_fkey";

-- DropTable
DROP TABLE "public"."CRMItem";

-- CreateTable
CREATE TABLE "public"."CrmItem" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "stage" "public"."Stage" NOT NULL DEFAULT 'ONBOARDING',
    "orgName" TEXT,
    "eventName" TEXT,
    "city" TEXT,
    "venue" TEXT,
    "eventLink" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "disabledReason" TEXT,
    "disabledAt" TIMESTAMP(3),
    "onboarding" JSONB NOT NULL,
    "active" JSONB NOT NULL,
    "activity" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmItem_organizerId_idx" ON "public"."CrmItem"("organizerId");

-- CreateIndex
CREATE INDEX "CrmItem_stage_idx" ON "public"."CrmItem"("stage");

-- AddForeignKey
ALTER TABLE "public"."CrmItem" ADD CONSTRAINT "CrmItem_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
