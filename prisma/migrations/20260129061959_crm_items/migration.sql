-- CreateEnum
CREATE TYPE "public"."Stage" AS ENUM ('ONBOARDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "public"."CRMItem" (
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

    CONSTRAINT "CRMItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CRMItem_organizerId_idx" ON "public"."CRMItem"("organizerId");

-- CreateIndex
CREATE INDEX "CRMItem_stage_idx" ON "public"."CRMItem"("stage");

-- AddForeignKey
ALTER TABLE "public"."CRMItem" ADD CONSTRAINT "CRMItem_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
