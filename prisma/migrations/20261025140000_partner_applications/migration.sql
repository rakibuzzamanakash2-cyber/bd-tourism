-- CreateEnum
CREATE TYPE "ApplicationKind" AS ENUM ('GUIDE', 'HOST');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'HOME_VISIT', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PartnerApplication" (
    "id" TEXT NOT NULL,
    "kind" "ApplicationKind" NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "step" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'en',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "regionIds" TEXT[],
    "heardFrom" TEXT,
    "details" JSONB,
    "photoUrl" TEXT,
    "homePhotos" TEXT[],
    "idDocument" JSONB,
    "licenceDocument" JSONB,
    "shareIdLater" BOOLEAN NOT NULL DEFAULT false,
    "inviteId" TEXT,
    "checklist" JSONB,
    "adminNotes" TEXT,
    "messageToApplicant" TEXT,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationInvite" (
    "id" TEXT NOT NULL,
    "kind" "ApplicationKind" NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerApplication_inviteId_key" ON "PartnerApplication"("inviteId");

-- CreateIndex
CREATE INDEX "PartnerApplication_kind_status_idx" ON "PartnerApplication"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerApplication_userId_kind_key" ON "PartnerApplication"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationInvite_token_key" ON "ApplicationInvite"("token");

-- AddForeignKey
ALTER TABLE "PartnerApplication" ADD CONSTRAINT "PartnerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApplication" ADD CONSTRAINT "PartnerApplication_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "ApplicationInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationInvite" ADD CONSTRAINT "ApplicationInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
