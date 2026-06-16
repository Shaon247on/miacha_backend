import { Router } from 'express';
import { 
  login, 
  getCurrentAdmin, 
  updateProfile, 
  updatePassword,
  uploadAvatar,
  deleteAvatar,
  refreshUserInfo,
  getUserInfo,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentAdmin);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);
router.get('/user-info', authenticate, getUserInfo);
router.post('/refresh', authenticate, refreshUserInfo);
router.post('/upload-avatar', authenticate, uploadAvatar);
router.delete('/avatar', authenticate, deleteAvatar);

export default router;