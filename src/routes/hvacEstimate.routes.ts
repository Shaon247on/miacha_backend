import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getSettings,
  updateSettings,
  calculatePrices,
  submitQuote,
  getQuotes,
  getQuoteById,
  updateQuoteStatus,
} from '../controllers/hvacEstimate.controller';

const router = Router();

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================
router.post('/calculate', calculatePrices);
router.post('/submit', submitQuote);

// ============================================================
// ADMIN ROUTES (Authentication required)
// ============================================================
// Settings
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

// Quotes management
router.get('/quotes', authenticate, getQuotes);
router.get('/quotes/:id', authenticate, getQuoteById);
router.patch('/quotes/:id/status', authenticate, updateQuoteStatus);

export default router;