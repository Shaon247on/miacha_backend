import { 
  WaterIssue, 
  AirQualitySymptom,
  ACType,
  RefrigerantType,
  PerformanceRating,
  HVACSystemType,
  BudgetRange,
  PreferredSolution,
  NoiseLevel,
  EfficiencyRating,
  PropertyType,
  WaterSource
} from '@prisma/client';

// Map string values to Prisma WaterIssue enum
export const toWaterIssueEnum = (issues: string[]): WaterIssue[] => {
  return issues.map(issue => issue as WaterIssue);
};

// Map string values to Prisma AirQualitySymptom enum
export const toAirQualitySymptomEnum = (symptoms: string[]): AirQualitySymptom[] => {
  return symptoms.map(symptom => symptom as AirQualitySymptom);
};

// Map for other enums if needed
export const toACTypeEnum = (type: string): ACType => type as ACType;
export const toRefrigerantTypeEnum = (type: string): RefrigerantType => type as RefrigerantType;
export const toPerformanceRatingEnum = (rating: string): PerformanceRating => rating as PerformanceRating;
export const toHVACSystemTypeEnum = (type: string): HVACSystemType => type as HVACSystemType;
export const toBudgetRangeEnum = (range: string): BudgetRange => range as BudgetRange;
export const toPreferredSolutionEnum = (solution: string): PreferredSolution => solution as PreferredSolution;
export const toNoiseLevelEnum = (level: string): NoiseLevel => level as NoiseLevel;
export const toEfficiencyRatingEnum = (rating: string): EfficiencyRating => rating as EfficiencyRating;
export const toPropertyTypeEnum = (type: string): PropertyType => type as PropertyType;
export const toWaterSourceEnum = (source: string): WaterSource => source as WaterSource;