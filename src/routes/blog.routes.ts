import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/cloudinary';
import {
  getActiveBlogs,      // Public - active only
  getBlogBySlug,        // Public - active only
  getCategories,        // Public - active only
  getAllBlogs,          // ✅ Admin - all blogs (including inactive)
  getBlogById,          // ✅ Admin - by ID (including inactive)
  toggleBlogStatus,     // ✅ Admin - toggle active/inactive
  createBlog,           // Admin
  updateBlog,           // Admin
  deleteBlog,           // Admin
  bulkDeleteBlogs,      // Admin
  uploadBlogImage,      // Admin
} from '../controllers/blog.controller';

const router = Router();

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================
router.get('/', getActiveBlogs);           // ✅ Only active blogs
router.get('/categories', getCategories);   // ✅ Only active categories
router.get('/:slug', getBlogBySlug);        // ✅ Only if active

// ============================================================
// PROTECTED ROUTES (Admin only)
// ============================================================
router.use(authenticate);

// Get all blogs (including inactive)
router.get('/admin/all', getAllBlogs);      // ✅ New: All blogs for admin

// Get blog by ID (including inactive)
router.get('/admin/:id', getBlogById);      // ✅ New: Get by ID

// Toggle blog status
router.patch('/admin/:id/toggle-status', toggleBlogStatus); // ✅ New: Toggle status

// CRUD operations
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.post('/bulk-delete', bulkDeleteBlogs);

// Image upload
router.post('/upload-image', upload.single('image'), uploadBlogImage);

export default router;