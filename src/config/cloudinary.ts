import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure memory storage
const memoryStorage = multer.memoryStorage();

// Create multer upload instance with 10MB limit
export const upload = multer({ 
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.'));
    }
  },
});

// Helper to upload buffer to Cloudinary
export const uploadToCloudinary = async (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Helper to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
  return matches ? matches[1] : null;
};

export default cloudinary;