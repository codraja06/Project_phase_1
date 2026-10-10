import { Router } from 'express';
import { detectIssue } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { upload, validateImageContent } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.post('/detect', upload.single('image'), validateImageContent, detectIssue);

export default router;
