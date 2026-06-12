-- CreateEnum
CREATE TYPE "ACType" AS ENUM ('CENTRAL', 'DUCTLESS_MINI_SPLIT', 'WINDOW', 'PORTABLE', 'PACKAGED_TERMINAL');

-- CreateEnum
CREATE TYPE "RefrigerantType" AS ENUM ('R22', 'R410A', 'R32', 'R134A', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PerformanceRating" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "HVACSystemType" AS ENUM ('AC_ONLY', 'HEAT_PUMP', 'FURNACE', 'BOILER', 'DUCTLESS', 'PACKAGED_UNIT');

-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('UNDER_500', 'BETWEEN_500_1000', 'BETWEEN_1000_2000', 'BETWEEN_2000_5000', 'OVER_5000', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "PreferredSolution" AS ENUM ('REPAIR', 'REPLACE', 'UPGRADE', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "NoiseLevel" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE', 'VERY_LOUD');

-- CreateEnum
CREATE TYPE "EfficiencyRating" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL_HOUSE', 'RESIDENTIAL_APARTMENT', 'COMMERCIAL_OFFICE', 'INDUSTRIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "WaterSource" AS ENUM ('MUNICIPAL', 'WELL', 'BOTH', 'OTHER');

-- CreateEnum
CREATE TYPE "WaterIssue" AS ENUM ('HARD_WATER', 'BAD_TASTE', 'BAD_ODOR', 'DISCOLORATION', 'SEDIMENT', 'CORROSION', 'SCALE_BUILDUP');

-- CreateEnum
CREATE TYPE "AirQualitySymptom" AS ENUM ('EXCESSIVE_DUST', 'MUSTY_ODOR', 'HIGH_HUMIDITY', 'LOW_HUMIDITY', 'ALLERGY_SYMPTOMS', 'RESPIRATORY_ISSUES', 'STATIC_ELECTRICITY', 'MOLD_GROWTH');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ac_rejuvenation_details" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "acType" "ACType" NOT NULL,
    "acAge" INTEGER,
    "lastServiceDate" TIMESTAMP(3),
    "refrigerantType" "RefrigerantType",
    "issues" TEXT[],
    "currentPerformance" "PerformanceRating",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ac_rejuvenation_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_replace_details" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "systemType" "HVACSystemType" NOT NULL,
    "systemAge" INTEGER,
    "currentIssue" TEXT NOT NULL,
    "emergency" BOOLEAN NOT NULL DEFAULT false,
    "budgetRange" "BudgetRange",
    "preferredSolution" "PreferredSolution",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_replace_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_tune_up_details" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "systemType" "HVACSystemType" NOT NULL,
    "lastTuneUpDate" TIMESTAMP(3),
    "specificConcerns" TEXT[],
    "noiseLevel" "NoiseLevel",
    "energyEfficiency" "EfficiencyRating",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_tune_up_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_quality_details" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "waterSource" "WaterSource" NOT NULL,
    "waterIssues" "WaterIssue"[],
    "hasWaterSoftener" BOOLEAN NOT NULL DEFAULT false,
    "hasFilterSystem" BOOLEAN NOT NULL DEFAULT false,
    "numberOfBathrooms" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_quality_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indoor_air_quality_details" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "propertySizeSqFt" INTEGER,
    "symptoms" "AirQualitySymptom"[],
    "hasHumidityIssue" BOOLEAN NOT NULL DEFAULT false,
    "hasDustIssue" BOOLEAN NOT NULL DEFAULT false,
    "hasOdorIssue" BOOLEAN NOT NULL DEFAULT false,
    "occupantsWithAllergy" INTEGER,
    "currentSystem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indoor_air_quality_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "estimatedCost" DOUBLE PRECISION,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ac_rejuvenation_details_appointmentId_key" ON "ac_rejuvenation_details"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "repair_replace_details_appointmentId_key" ON "repair_replace_details"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "repair_tune_up_details_appointmentId_key" ON "repair_tune_up_details"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "water_quality_details_appointmentId_key" ON "water_quality_details"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "indoor_air_quality_details_appointmentId_key" ON "indoor_air_quality_details"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_appointmentId_key" ON "service_requests"("appointmentId");

-- AddForeignKey
ALTER TABLE "ac_rejuvenation_details" ADD CONSTRAINT "ac_rejuvenation_details_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_replace_details" ADD CONSTRAINT "repair_replace_details_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_tune_up_details" ADD CONSTRAINT "repair_tune_up_details_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_quality_details" ADD CONSTRAINT "water_quality_details_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indoor_air_quality_details" ADD CONSTRAINT "indoor_air_quality_details_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
