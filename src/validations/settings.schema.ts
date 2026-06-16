import { z } from 'zod';

// Company Settings Schema
export const companySettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Phone number is required'),
  contactAddress: z.string().min(1, 'Address is required'),
  companyLogo: z.string().url('Invalid URL').optional().nullable(),
  companyFavicon: z.string().url('Invalid URL').optional().nullable(),
  facebookUrl: z.string().url('Invalid URL').optional().nullable(),
  twitterUrl: z.string().url('Invalid URL').optional().nullable(),
  instagramUrl: z.string().url('Invalid URL').optional().nullable(),
  linkedinUrl: z.string().url('Invalid URL').optional().nullable(),
});

// Profile Settings Schema
export const profileSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  avatar: z.string().url('Invalid URL').optional().nullable(),
});

// Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;