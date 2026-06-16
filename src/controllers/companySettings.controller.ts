import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import cloudinary from '../config/cloudinary';

// Helper to upload base64 to Cloudinary
const uploadBase64ToCloudinary = async (base64String: string, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64String,
      {
        folder: folder,
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
  });
};


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
      return;
    }

    const companySettings = await prisma.companySettings.findFirst();

    res.cookie('user_info', JSON.stringify({
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
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  } catch (error) {
    console.error('Error refreshing user info cookie:', error);
  }
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

// Public - Get company settings
export const getCompanySettings = async (req: Request, res: Response): Promise<void> => {
  try {
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
    
    res.status(200).json({
      status: 'success',
      data: settings,
    });
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get company settings',
    });
  }
};

// Update company settings
export const updateCompanySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    const data = req.body;
    
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'Only super admin can update company settings',
      });
      return;
    }
    
    let settings = await prisma.companySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    }
    
    // ✅ REFRESH COOKIE with updated company info
    await refreshUserInfoCookie(res, adminId);
    
    res.status(200).json({
      status: 'success',
      message: 'Company settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update company settings',
    });
  }
};

// Upload logo from base64
export const uploadLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    const { image, fileName } = req.body;
    
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'Only super admin can upload company logo',
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
    const logoUrl = await uploadBase64ToCloudinary(image, 'company-logos');
    
    // Get existing settings
    let settings = await prisma.companySettings.findFirst();
    
    // Delete old logo if exists
    if (settings?.companyLogo) {
      const oldPublicId = getPublicIdFromUrl(settings.companyLogo);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyLogo: logoUrl,
          updatedBy: adminId,
        },
      });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          companyLogo: logoUrl,
          updatedBy: adminId,
        },
      });
    }
    
    // ✅ REFRESH COOKIE with updated logo
    await refreshUserInfoCookie(res, adminId);
    
    res.status(200).json({
      status: 'success',
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload logo',
    });
  }
};

// Delete logo
export const deleteLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'Only super admin can delete company logo',
      });
      return;
    }
    
    const settings = await prisma.companySettings.findFirst();
    
    if (!settings || !settings.companyLogo) {
      res.status(404).json({
        status: 'error',
        message: 'No logo found to delete',
      });
      return;
    }
    
    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(settings.companyLogo);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
    
    await prisma.companySettings.update({
      where: { id: settings.id },
      data: {
        companyLogo: null,
        updatedBy: adminId,
      },
    });
    
    // ✅ REFRESH COOKIE with logo removed
    await refreshUserInfoCookie(res, adminId);
    
    res.status(200).json({
      status: 'success',
      message: 'Logo deleted successfully',
    });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete logo',
    });
  }
};