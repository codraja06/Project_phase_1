import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Complaint, ComplaintStatus } from '../models/Complaint';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { updateStatusSchema } from '../validators/complaintValidator';

export const getAllComplaints = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, sortBy } = req.query;
    const filter: any = {};

    if (typeof status === 'string' && status !== 'All' && status !== 'all') {
      const s = status.toString().toLowerCase().replace('_', ' ');
      if (s === 'pending') filter.status = 'Pending';
      else if (s === 'in progress' || s === 'in_progress') filter.status = 'In Progress';
      else if (s === 'resolved') filter.status = 'Resolved';
      else if (s === 'urgent' || s === 'high') filter.priority = { $in: ['high', 'urgent'] };
      else filter.status = status;
    }
    if (typeof category === 'string' && category !== 'All' && category !== 'all') {
      filter.category = category;
    }
    if (search && typeof search === 'string') {
      const literalSearch = search.slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { complaintId: { $regex: literalSearch, $options: 'i' } },
        { title: { $regex: literalSearch, $options: 'i' } },
        { description: { $regex: literalSearch, $options: 'i' } },
        { address: { $regex: literalSearch, $options: 'i' } },
      ];
    }

    const sortOrder = sortBy === 'oldest' ? 1 : -1;

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: sortOrder })
      .populate('createdBy', 'name email phone');

    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const highPriority = await Complaint.countDocuments({ priority: { $in: ['high', 'urgent'] } });
    const verifiedCount = await Complaint.countDocuments({ verified: true });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = await Complaint.countDocuments({ createdAt: { $gte: startOfToday } });

    const categories = ['pothole', 'road_damage', 'garbage', 'garbage_overflow', 'broken_streetlight', 'drainage', 'drainage_problem', 'water_leakage', 'dead_animal', 'broken_tree'];
    const categoryStats: Record<string, number> = {};
    for (const cat of categories) {
      categoryStats[cat] = await Complaint.countDocuments({ category: cat });
    }

    res.status(200).json(
      new ApiResponse('All complaints retrieved for authority', {
        complaints,
        stats: {
          total,
          pending,
          inProgress,
          resolved,
          highPriority,
          today,
          verifiedCount,
          categoryStats,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getAuthorityComplaintById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('createdBy', 'name email phone');

    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    res.status(200).json(new ApiResponse('Complaint detail for authority', complaint));
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = updateStatusSchema.parse(req.body);

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    const currentStatus: ComplaintStatus = complaint.status;

    // Idempotent: If already in target status, return 200 without error
    if (currentStatus === targetStatus) {
      return res.status(200).json(new ApiResponse('Complaint is already in requested status', complaint));
    }

    // Resolved records are final and cannot be reverted
    if (currentStatus === 'Resolved') {
      throw new ApiError(400, `Complaint is already 'Resolved' and cannot be modified further.`);
    }

    // In Progress cannot revert to Pending
    if (currentStatus === 'In Progress' && targetStatus === 'Pending') {
      throw new ApiError(
        400,
        `Invalid status transition. Complaints in 'In Progress' status can only transition to 'Resolved'.`
      );
    }

    // Pending cannot jump directly to Resolved without being In Progress first
    if (currentStatus === 'Pending' && targetStatus === 'Resolved') {
      throw new ApiError(
        400,
        `Invalid status transition. Complaints in 'Pending' status cannot transition directly to 'Resolved'.`
      );
    }

    const updated = await Complaint.findOneAndUpdate(
      { _id: id, status: currentStatus },
      { $set: { status: targetStatus, ...(targetStatus === 'Resolved' ? { resolvedAt: new Date() } : {}) } },
      { new: true, runValidators: true }
    );
    if (!updated) throw new ApiError(409, 'This complaint changed. Refresh before trying again.');
    res.status(200).json(new ApiResponse('Complaint status updated successfully', updated));
  } catch (error) {
    next(error);
  }
};

export const deleteComplaint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    await Complaint.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse('Complaint deleted successfully by authority', { id }));
  } catch (error) {
    next(error);
  }
};

export const verifyComplaint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    complaint.verified = true;
    if (req.user) {
      complaint.officerId = req.user._id;
    }

    await complaint.save();

    res.status(200).json(new ApiResponse('Complaint verified by authority', complaint));
  } catch (error) {
    next(error);
  }
};
