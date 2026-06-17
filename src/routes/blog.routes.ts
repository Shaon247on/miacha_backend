import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  getCategories,
  createBlog,
  updateBlog,
  deleteBlog,
  bulkDeleteBlogs,
} from '../controllers/blog.controller';

const router = Router();

// Public routes
router.get('/', getBlogs);
router.get('/categories', getCategories);
router.get('/:slug', getBlogBySlug);

// Protected routes (admin only)
router.use(authenticate);
router.get('/id/:id', getBlogById);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.post('/bulk-delete', bulkDeleteBlogs);

export default router;