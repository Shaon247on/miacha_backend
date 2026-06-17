import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";
import {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "../validations/appointment.validation";
import {
  toWaterIssueEnum,
  toAirQualitySymptomEnum,
  toACTypeEnum,
  toRefrigerantTypeEnum,
  toPerformanceRatingEnum,
  toHVACSystemTypeEnum,
  toBudgetRangeEnum,
  toPreferredSolutionEnum,
  toNoiseLevelEnum,
  toEfficiencyRatingEnum,
  toPropertyTypeEnum,
  toWaterSourceEnum,
} from "../types/prisma-enums";

export const createAppointment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = req.body as CreateAppointmentInput;

    // Create the main appointment
    const appointment = await prisma.$transaction(async (tx) => {
      // Create base appointment
      const baseAppointment = await tx.appointment.create({
        data: {
          appointmentType: data.appointmentType,
          serviceType: data.serviceType || null,
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          preferredDate: new Date(data.preferredDate),
          preferredTime: data.preferredTime,
          additionalNote: data.additionalNote || null,
          status: "PENDING",
        },
      });

      // Create service-specific details
      switch (data.appointmentType) {
        case "AC_REJUVENATION":
          await tx.acRejuvenationDetails.create({
            data: {
              appointmentId: baseAppointment.id,
              acType: toACTypeEnum(data.acRejuvenationDetails.acType),
              acAge: data.acRejuvenationDetails.acAge,
              lastServiceDate: data.acRejuvenationDetails.lastServiceDate
                ? new Date(data.acRejuvenationDetails.lastServiceDate)
                : null,
              refrigerantType: data.acRejuvenationDetails.refrigerantType
                ? toRefrigerantTypeEnum(
                    data.acRejuvenationDetails.refrigerantType,
                  )
                : null,
              issues: data.acRejuvenationDetails.issues,
              currentPerformance: data.acRejuvenationDetails.currentPerformance
                ? toPerformanceRatingEnum(
                    data.acRejuvenationDetails.currentPerformance,
                  )
                : null,
            },
          });
          break;

        case "REPAIR_OR_REPLACE":
          await tx.repairReplaceDetails.create({
            data: {
              appointmentId: baseAppointment.id,
              systemType: toHVACSystemTypeEnum(
                data.repairReplaceDetails.systemType,
              ),
              systemAge: data.repairReplaceDetails.systemAge,
              currentIssue: data.repairReplaceDetails.currentIssue,
              emergency: data.repairReplaceDetails.emergency,
              budgetRange: data.repairReplaceDetails.budgetRange
                ? toBudgetRangeEnum(data.repairReplaceDetails.budgetRange)
                : null,
              preferredSolution: data.repairReplaceDetails.preferredSolution
                ? toPreferredSolutionEnum(
                    data.repairReplaceDetails.preferredSolution,
                  )
                : null,
            },
          });
          break;

        case "REPAIR_AND_TUNE_UP":
          await tx.repairTuneUpDetails.create({
            data: {
              appointmentId: baseAppointment.id,
              systemType: toHVACSystemTypeEnum(
                data.repairTuneUpDetails.systemType,
              ),
              lastTuneUpDate: data.repairTuneUpDetails.lastTuneUpDate
                ? new Date(data.repairTuneUpDetails.lastTuneUpDate)
                : null,
              specificConcerns: data.repairTuneUpDetails.specificConcerns,
              noiseLevel: data.repairTuneUpDetails.noiseLevel
                ? toNoiseLevelEnum(data.repairTuneUpDetails.noiseLevel)
                : null,
              energyEfficiency: data.repairTuneUpDetails.energyEfficiency
                ? toEfficiencyRatingEnum(
                    data.repairTuneUpDetails.energyEfficiency,
                  )
                : null,
            },
          });
          break;

        case "WATER_QUALITY_SOLUTIONS":
          await tx.waterQualityDetails.create({
            data: {
              appointmentId: baseAppointment.id,
              propertyType: toPropertyTypeEnum(
                data.waterQualityDetails.propertyType,
              ),
              waterSource:
                toWaterSourceEnum(data.waterQualityDetails.waterSource) ||
                "MUNICIPAL",
              waterIssues:
                toWaterIssueEnum(data.waterQualityDetails.waterIssues) || [],
              hasWaterSoftener:
                data.waterQualityDetails.hasWaterSoftener || false,
              hasFilterSystem:
                data.waterQualityDetails.hasFilterSystem || false,
              numberOfBathrooms:
                data.waterQualityDetails.numberOfBathrooms || null,
            },
          });
          break;

        case "INDOOR_AIR_QUALITY":
          await tx.indoorAirQualityDetails.create({
            data: {
              appointmentId: baseAppointment.id,
              propertySizeSqFt: data.indoorAirQualityDetails.propertySizeSqFt,
              symptoms: toAirQualitySymptomEnum(
                data.indoorAirQualityDetails.symptoms,
              ),
              hasHumidityIssue: data.indoorAirQualityDetails.hasHumidityIssue,
              hasDustIssue: data.indoorAirQualityDetails.hasDustIssue,
              hasOdorIssue: data.indoorAirQualityDetails.hasOdorIssue,
              occupantsWithAllergy:
                data.indoorAirQualityDetails.occupantsWithAllergy,
              currentSystem: data.indoorAirQualityDetails.currentSystem,
            },
          });
          break;
      }

      return baseAppointment;
    });

    res.status(201).json({
      status: "success",
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllAppointments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Parse query parameters with proper type handling
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as any;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const search = req.query.search as string;

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.preferredDate = {};
      if (startDate) where.preferredDate.gte = startDate;
      if (endDate) where.preferredDate.lte = endDate;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get appointments with pagination
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          acRejuvenationDetails: true,
          repairReplaceDetails: true,
          repairTuneUpDetails: true,
          waterQualityDetails: true,
          indoorAirQualityDetails: true,
          serviceRequest: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        appointments,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get appointments",
    });
  }
};

export const getAppointmentById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        acRejuvenationDetails: true,
        repairReplaceDetails: true,
        repairTuneUpDetails: true,
        waterQualityDetails: true,
        indoorAirQualityDetails: true,
        serviceRequest: true,
      },
    });

    if (!appointment) {
      res.status(404).json({
        status: "error",
        message: "Appointment not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get appointment",
    });
  }
};

export const updateAppointmentStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as UpdateAppointmentStatusInput;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      status: "success",
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update appointment status",
    });
  }
};

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      total,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      todayAppointments,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "CONFIRMED" } }),
      prisma.appointment.count({ where: { status: "IN_PROGRESS" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.appointment.count({
        where: {
          preferredDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        total,
        pending,
        confirmed,
        inProgress,
        completed,
        cancelled,
        todayAppointments,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get dashboard statistics",
    });
  }
};
