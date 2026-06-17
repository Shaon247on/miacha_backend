import { Router } from 'express';
import { chat } from '../controllers/chat.controller';

const router = Router();

// Chat endpoint - no rate limiting for now (add later)
router.post('/', chat);

export default router;