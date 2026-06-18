-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'REVIEWED', 'CONTACTED', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "hvac_estimate_settings" (
    "id" TEXT NOT NULL,
    "baseRatePerSqFt" DOUBLE PRECISION NOT NULL DEFAULT 5.00,
    "laborRatePerHour" DOUBLE PRECISION NOT NULL DEFAULT 75.00,
    "markupPercentage" DOUBLE PRECISION NOT NULL DEFAULT 25.00,
    "tier1Multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "tier2Multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "tier3Multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.7,
    "installationBaseFee" DOUBLE PRECISION NOT NULL DEFAULT 1500.00,
    "permitFee" DOUBLE PRECISION NOT NULL DEFAULT 200.00,
    "disposalFee" DOUBLE PRECISION NOT NULL DEFAULT 150.00,
    "monthlyPaymentRate" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "hvac_estimate_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hvac_quotes" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "squareFootage" INTEGER NOT NULL,
    "stories" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "heatingSource" TEXT NOT NULL,
    "selectedTier" INTEGER NOT NULL,
    "systemBrand" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "systemPrice" DOUBLE PRECISION NOT NULL,
    "retailPrice" DOUBLE PRECISION NOT NULL,
    "cashPrice" DOUBLE PRECISION NOT NULL,
    "onlineSavings" DOUBLE PRECISION NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "orderNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appointmentId" TEXT,

    CONSTRAINT "hvac_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hvac_quotes_orderNumber_key" ON "hvac_quotes"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hvac_quotes_appointmentId_key" ON "hvac_quotes"("appointmentId");

-- CreateIndex
CREATE INDEX "hvac_quotes_email_idx" ON "hvac_quotes"("email");

-- CreateIndex
CREATE INDEX "hvac_quotes_status_idx" ON "hvac_quotes"("status");

-- AddForeignKey
ALTER TABLE "hvac_quotes" ADD CONSTRAINT "hvac_quotes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
