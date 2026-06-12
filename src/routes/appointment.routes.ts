import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getDashboardStats,
} from '../controllers/appointment.controller';

const router = Router();

// Public routes (no authentication required)
router.post('/', createAppointment);

// Protected routes (admin only)
router.use(authenticate);
router.get('/', getAllAppointments);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id', getAppointmentById);
router.patch('/:id/status', updateAppointmentStatus);

export default router;