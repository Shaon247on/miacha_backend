import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';

// Helper to upload base64 to Cloudinary
const uploadBase64ToCloudinary = async (base64String: string, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64String,
      {
        folder: folder,
        transformation: [{ width: 200, height: 200, crop: 'limit', radius: 'max' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
  });
};

// Helper to delete image from Cloudinary
const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Helper to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url: string): string | null => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
  return matches ? matches[1] : null;
};

// Get company settings
const getCompanySettings = async () => {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        companyName: 'HVAC Service',
        contactEmail: 'contact@hvacservices.com',
        contactPhone: '(555) 123-4567',
        contactAddress: '123 Main Street, Joliet, IL 60401',
      },
    });
  }
  return settings;
};

// In src/controllers/auth.controller.ts
const refreshUserInfoCookie = async (res: Response, userId: string) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    if (!admin) {
      console.error('Admin not found for cookie refresh');
      return;
    }

    const companySettings = await getCompanySettings();
console.log("token updated 🟢")
    const userInfo = {
      id: admin.id,
      email: admin.email,
      name: admin.name, // This should be the updated name
      role: admin.role,
      avatar: admin.avatar,
      companyName: companySettings.companyName,
      companyLogo: companySettings.companyLogo,
      companyEmail: companySettings.contactEmail,
      companyPhone: companySettings.contactPhone,
      companyAddress: companySettings.contactAddress,
    };

    console.log('Setting user_info cookie with:', userInfo);

    res.cookie('user_info', JSON.stringify(userInfo), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
console.log("the cookie",res.cookie)
    console.log('User info cookie refreshed for:', admin.email);
  } catch (error) {
    console.error('Error refreshing user info cookie:', error);
  }
};


// Helper to update user_info cookie
const updateUserInfoCookie = async (res: Response, userId: string) => {
  const admin = await prisma.admin.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
    },
  });

  if (admin) {
    const companySettings = await getCompanySettings();
    
    res.cookie('user_info', JSON.stringify({
      // User info
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      // Company info
      companyName: companySettings.companyName,
      companyLogo: companySettings.companyLogo,
      companyEmail: companySettings.contactEmail,
      companyPhone: companySettings.contactPhone,
      companyAddress: companySettings.contactAddress,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
};

// Login function
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
      return;
    }

    const token = generateToken(admin.id, admin.email, admin.role);
    
    // Get company settings
    const companySettings = await getCompanySettings();

    // Set auth token cookie (HTTP-only)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Set user info cookie (not HTTP-only) - includes company info
    res.cookie('user_info', JSON.stringify({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      companyName: companySettings.companyName,
      companyLogo: companySettings.companyLogo,
      companyEmail: companySettings.contactEmail,
      companyPhone: companySettings.contactPhone,
      companyAddress: companySettings.contactAddress,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          avatar: admin.avatar,
        },
        company: {
          name: companySettings.companyName,
          logo: companySettings.companyLogo,
          email: companySettings.contactEmail,
          phone: companySettings.contactPhone,
          address: companySettings.contactAddress,
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};


export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    // Get user data
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Get company settings
    const companySettings = await prisma.companySettings.findFirst();

    // Combine data
    const userInfo = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      companyName: companySettings?.companyName || 'HVAC Service',
      companyLogo: companySettings?.companyLogo || null,
      companyEmail: companySettings?.contactEmail || 'contact@hvacservices.com',
      companyPhone: companySettings?.contactPhone || '(555) 123-4567',
      companyAddress: companySettings?.contactAddress || '123 Main Street, Joliet, IL 60401',
    };

    res.status(200).json({
      status: 'success',
      data: userInfo,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user info',
    });
  }
};

// Get current admin
export const getCurrentAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let userId = req.user?.userId;
    
    if (!userId && req.cookies.user_info) {
      try {
        const userInfo = JSON.parse(req.cookies.user_info);
        userId = userInfo.id;
      } catch (e) {
        // Invalid cookie
      }
    }
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
      return;
    }
    
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!admin) {
      res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
      return;
    }

    // Update cookie with latest data
    await updateUserInfoCookie(res, userId);

    res.status(200).json({
      status: 'success',
      data: admin
    });
  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Update profile - FIXED to refresh cookie
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, avatar } = req.body;
    const userId = req.user?.userId;

    console.log('Update profile request for user:', userId);
    console.log('New name:', name);

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    // ... rest of the code

    const updatedAdmin = await prisma.admin.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    console.log('Updated admin:', updatedAdmin);

    // ✅ REFRESH COOKIE with updated data
    await refreshUserInfoCookie(res, userId);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedAdmin,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

// Upload avatar - FIXED to refresh cookie
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    const { image, fileName } = req.body;
    
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    
    if (!admin) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }
    
    if (!image) {
      res.status(400).json({
        status: 'error',
        message: 'No image data provided',
      });
      return;
    }
    
    // Upload to Cloudinary from base64
    const avatarUrl = await uploadBase64ToCloudinary(image, 'admin-avatars');
    
    // Delete old avatar if exists
    if (admin.avatar) {
      const oldPublicId = getPublicIdFromUrl(admin.avatar);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }
    
    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        avatar: avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
    
    // ✅ REFRESH COOKIE with updated avatar
    await refreshUserInfoCookie(res, adminId);
    
    res.status(200).json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload avatar',
    });
  }
};

// Delete avatar - FIXED to refresh cookie
export const deleteAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    
    if (!admin) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }
    
    if (!admin.avatar) {
      res.status(404).json({
        status: 'error',
        message: 'No avatar found to delete',
      });
      return;
    }
    
    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(admin.avatar);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
    
    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        avatar: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
    
    // ✅ REFRESH COOKIE with avatar removed
    await refreshUserInfoCookie(res, adminId);
    
    res.status(200).json({
      status: 'success',
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete avatar',
    });
  }
};

// Update password
export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      res.status(404).json({
        status: 'error',
        message: 'Admin not found',
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Password doesn't affect the user_info cookie, so no update needed

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update password',
    });
  }
};

export const refreshUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }
    
    await refreshUserInfoCookie(res, userId);
    
    // Get updated user info
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
    
    res.status(200).json({
      status: 'success',
      message: 'User info refreshed',
      data: admin,
    });
  } catch (error) {
    console.error('Refresh user info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh user info',
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('user_info', { path: '/' });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};