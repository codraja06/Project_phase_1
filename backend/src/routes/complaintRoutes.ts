import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
} from '../controllers/complaintController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

import { updateComplaintStatus } from '../controllers/authorityController';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRoles('citizen'), createComplaint);
router.get('/my', authorizeRoles('citizen'), getMyComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', authorizeRoles('authority'), updateComplaintStatus);

export default router;
