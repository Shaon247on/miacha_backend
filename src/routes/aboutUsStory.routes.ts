import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getStory, updateStory } from '../controllers/aboutUsStory.controller';

const router = Router();

// Public route - Get story content
router.get('/', getStory);

// Protected route - Update story content (admin only)
router.put('/', authenticate, updateStory);

export default router;