import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  getCompanySettings, 
  updateCompanySettings,
  uploadLogo,
  deleteLogo,
} from '../controllers/companySettings.controller';

const router = Router();

// Public route - Get company settings
router.get('/', getCompanySettings);

// Protected routes
router.use(authenticate);
router.put('/', updateCompanySettings);
router.post('/upload-logo', uploadLogo);
router.delete('/logo', deleteLogo);

export default router;