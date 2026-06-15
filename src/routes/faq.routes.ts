import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
  bulkUpdateOrder,
} from '../controllers/faq.controller';

const router = Router();

// Public routes (no authentication required for viewing)
router.get('/', getAllFAQs);
router.get('/:id', getFAQById);

// Protected routes (admin only)
router.use(authenticate);
router.post('/', createFAQ);
router.put('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);
router.patch('/bulk-order', bulkUpdateOrder);

export default router;