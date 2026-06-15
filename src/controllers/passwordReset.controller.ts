import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendOTPEmail, sendPasswordResetSuccessEmail } from '../services/email.service';
import { ForgotPasswordInput, VerifyOtpInput, ResetPasswordInput } from '../validations/passwordReset.validation';

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate reset token
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Forgot Password - Send OTP
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordInput;

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
      return;
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      // Don't reveal that email doesn't exist for security
      res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, you will receive an OTP shortly.',
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    // Save OTP to database
    await prisma.oTP.create({
      data: {
        email,
        otp,
        expiresAt,
        isUsed: false,
      },
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp, admin.name);

    if (!emailSent) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again later.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully to your email.',
      data: {
        email,
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process request. Please try again.',
    });
  }
};

// Verify OTP and generate reset token
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body as VerifyOtpInput;

    if (!email || !otp) {
      res.status(400).json({
        status: 'error',
        message: 'Email and OTP are required',
      });
      return;
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        otp,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP. Please request a new one.',
      });
      return;
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date();
    resetExpiresAt.setMinutes(resetExpiresAt.getMinutes() + 15);

    // Save reset token to admin
    await prisma.admin.update({
      where: { email },
      data: {
        resetToken,
        resetExpiresAt,
      },
    });

    // Return the reset token to frontend
    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully.',
      data: {
        email,
        resetToken, // Make sure this is included
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify OTP. Please try again.',
    });
  }
};

// Reset Password using token (no OTP required)
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      res.status(400).json({
        status: 'error',
        message: 'Reset token and new password are required',
      });
      return;
    }

    // Find admin with valid reset token
    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: resetToken,
        resetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!admin) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token. Please request a new password reset.',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password and clear reset token
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiresAt: null,
      },
    });

    // Clean up old OTPs for this email
    await prisma.oTP.deleteMany({
      where: { email: admin.email },
    });

    // Send success email
    await sendPasswordResetSuccessEmail(admin.email, admin.name);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password. Please try again.',
    });
  }
};

// Resend OTP
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordInput;

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
      return;
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, you will receive an OTP shortly.',
      });
      return;
    }

    // Mark all previous OTPs as used
    await prisma.oTP.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save new OTP
    await prisma.oTP.create({
      data: {
        email,
        otp,
        expiresAt,
        isUsed: false,
      },
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp, admin.name);

    if (!emailSent) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again later.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'New OTP sent successfully to your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resend OTP. Please try again.',
    });
  }
};