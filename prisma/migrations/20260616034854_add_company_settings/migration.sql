-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "resetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetToken" TEXT;

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'HVAC Service',
    "companyLogo" TEXT,
    "companyFavicon" TEXT,
    "contactEmail" TEXT NOT NULL DEFAULT 'contact@hvacservices.com',
    "contactPhone" TEXT NOT NULL DEFAULT '(555) 123-4567',
    "contactAddress" TEXT NOT NULL DEFAULT '123 Main Street, Joliet, IL 60401',
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "businessHours" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_email_idx" ON "otps"("email");

-- CreateIndex
CREATE INDEX "otps_otp_idx" ON "otps"("otp");
