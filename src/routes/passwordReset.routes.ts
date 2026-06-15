import { Router } from 'express';
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
} from '../controllers/passwordReset.controller';

const router = Router();

// Public routes (no authentication required)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOtp);

export default router;