import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.post('/image', upload.single('image'), uploadImage);

export default router;
