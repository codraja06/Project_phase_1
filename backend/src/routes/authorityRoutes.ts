import { Router } from 'express';
import {
  getAllComplaints,
  getAuthorityComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  verifyComplaint,
} from '../controllers/authorityController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { exportAuthorityAnalytics } from '../controllers/analyticsExportController';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('authority'));

router.get('/analytics/export', exportAuthorityAnalytics);

router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getAuthorityComplaintById);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.patch('/complaints/:id/verify', verifyComplaint);
router.delete('/complaints/:id', deleteComplaint);

export default router;
