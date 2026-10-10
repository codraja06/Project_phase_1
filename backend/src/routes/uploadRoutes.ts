import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload, validateImageContent } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.post('/image', upload.single('image'), validateImageContent, uploadImage);

export default router;
