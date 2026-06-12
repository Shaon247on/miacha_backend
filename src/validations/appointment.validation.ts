import { z } from 'zod';

// Base appointment schema
const baseAppointmentSchema = {
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  preferredDate: z.string().transform((str) => new Date(str)),
  preferredTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  additionalNote: z.string().optional(),
  serviceType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'BOTH']).optional(),
};

// AC Rejuvenation specific schema
const acRejuvenationSchema = z.object({
  acType: z.enum(['CENTRAL', 'DUCTLESS_MINI_SPLIT', 'WINDOW', 'PORTABLE', 'PACKAGED_TERMINAL']),
  acAge: z.number().min(0).max(50).optional(),
  lastServiceDate: z.string().transform((str) => new Date(str)).optional(),
  refrigerantType: z.enum(['R22', 'R410A', 'R32', 'R134A', 'UNKNOWN']).optional(),
  issues: z.array(z.string()),
  currentPerformance: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NOT_WORKING']).optional(),
});

// Repair or Replace specific schema
const repairReplaceSchema = z.object({
  systemType: z.enum(['AC_ONLY', 'HEAT_PUMP', 'FURNACE', 'BOILER', 'DUCTLESS', 'PACKAGED_UNIT']),
  systemAge: z.number().min(0).max(50).optional(),
  currentIssue: z.string().min(10, 'Please describe the issue'),
  emergency: z.boolean().default(false),
  budgetRange: z.enum(['UNDER_500', 'BETWEEN_500_1000', 'BETWEEN_1000_2000', 'BETWEEN_2000_5000', 'OVER_5000', 'NOT_SURE']).optional(),
  preferredSolution: z.enum(['REPAIR', 'REPLACE', 'UPGRADE', 'CONSULTATION']).optional(),
});

// Repair and Tune Up specific schema
const repairTuneUpSchema = z.object({
  systemType: z.enum(['AC_ONLY', 'HEAT_PUMP', 'FURNACE', 'BOILER', 'DUCTLESS', 'PACKAGED_UNIT']),
  lastTuneUpDate: z.string().transform((str) => new Date(str)).optional(),
  specificConcerns: z.array(z.string()),
  noiseLevel: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE', 'VERY_LOUD']).optional(),
  energyEfficiency: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'NOT_SURE']).optional(),
});

// Water Quality specific schema
const waterQualitySchema = z.object({
  propertyType: z.enum(['RESIDENTIAL_HOUSE', 'RESIDENTIAL_APARTMENT', 'COMMERCIAL_OFFICE', 'INDUSTRIAL', 'OTHER']),
  waterSource: z.enum(['MUNICIPAL', 'WELL', 'BOTH', 'OTHER']),
  waterIssues: z.array(z.string()),
  hasWaterSoftener: z.boolean().default(false),
  hasFilterSystem: z.boolean().default(false),
  numberOfBathrooms: z.number().min(0).optional(),
});

// Indoor Air Quality specific schema
const indoorAirQualitySchema = z.object({
  propertySizeSqFt: z.number().min(0).optional(),
  symptoms: z.array(z.string()),
  hasHumidityIssue: z.boolean().default(false),
  hasDustIssue: z.boolean().default(false),
  hasOdorIssue: z.boolean().default(false),
  occupantsWithAllergy: z.number().min(0).optional(),
  currentSystem: z.string().optional(),
});

// Main create appointment schema
export const createAppointmentSchema = z.discriminatedUnion('appointmentType', [
  z.object({
    appointmentType: z.literal('AC_REJUVENATION'),
    ...baseAppointmentSchema,
    acRejuvenationDetails: acRejuvenationSchema,
  }),
  z.object({
    appointmentType: z.literal('REPAIR_OR_REPLACE'),
    ...baseAppointmentSchema,
    repairReplaceDetails: repairReplaceSchema,
  }),
  z.object({
    appointmentType: z.literal('REPAIR_AND_TUNE_UP'),
    ...baseAppointmentSchema,
    repairTuneUpDetails: repairTuneUpSchema,
  }),
  z.object({
    appointmentType: z.literal('WATER_QUALITY_SOLUTIONS'),
    ...baseAppointmentSchema,
    waterQualityDetails: waterQualitySchema,
  }),
  z.object({
    appointmentType: z.literal('INDOOR_AIR_QUALITY'),
    ...baseAppointmentSchema,
    indoorAirQualityDetails: indoorAirQualitySchema,
  }),
]);

// Update appointment status schema
export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
});

// Get appointments query schema
export const getAppointmentsQuerySchema = z.object({
  page: z.string().optional().transform(Number).default(1),
  limit: z.string().optional().transform(Number).default(10),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  search: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type GetAppointmentsQueryInput = z.infer<typeof getAppointmentsQuerySchema>;