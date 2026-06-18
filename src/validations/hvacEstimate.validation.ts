import { z } from 'zod';

// HVAC Estimate Settings Schema
export const hvacEstimateSettingsSchema = z.object({
  baseRatePerSqFt: z.number().min(0, 'Base rate must be positive'),
  laborRatePerHour: z.number().min(0, 'Labor rate must be positive'),
  markupPercentage: z.number().min(0, 'Markup percentage must be positive'),
  tier1Multiplier: z.number().min(0, 'Tier 1 multiplier must be positive'),
  tier2Multiplier: z.number().min(0, 'Tier 2 multiplier must be positive'),
  tier3Multiplier: z.number().min(0, 'Tier 3 multiplier must be positive'),
  installationBaseFee: z.number().min(0, 'Installation base fee must be positive'),
  permitFee: z.number().min(0, 'Permit fee must be positive'),
  disposalFee: z.number().min(0, 'Disposal fee must be positive'),
  monthlyPaymentRate: z.number().min(0, 'Monthly payment rate must be positive'),
});

// ✅ Updated HVAC Quote Schema - more flexible
export const hvacQuoteSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  squareFootage: z.number().int().min(100, 'Square footage must be at least 100'),
  stories: z.number().int().min(1, 'Stories must be at least 1'),
  bedrooms: z.number().int().min(1, 'Bedrooms must be at least 1'),
  heatingSource: z.string().min(1, 'Heating source is required'),
  selectedTier: z.number().int().min(1).max(3, 'Tier must be 1, 2, or 3'),
  systemBrand: z.string().min(1, 'System brand is required'),
  systemName: z.string().min(1, 'System name is required'),
  systemPrice: z.number().min(0, 'System price must be positive'),
  retailPrice: z.number().min(0, 'Retail price must be positive'),
  cashPrice: z.number().min(0, 'Cash price must be positive'),
  onlineSavings: z.number().min(0, 'Online savings must be positive'),
  monthlyPayment: z.number().min(0, 'Monthly payment must be positive'),
  preferredDate: z.string().nullable().optional(),
  preferredTime: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type HvacEstimateSettingsInput = z.infer<typeof hvacEstimateSettingsSchema>;
export type HvacQuoteInput = z.infer<typeof hvacQuoteSchema>;