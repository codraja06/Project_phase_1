import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Complaint } from '../models/Complaint';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { createComplaintSchema } from '../validators/complaintValidator';

export const createComplaint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const validated = createComplaintSchema.parse(req.body);

    const complaint = await Complaint.create({
      ...validated,
      createdBy: req.user._id,
      status: 'Pending',
    });

    res.status(201).json(new ApiResponse('Complaint created successfully', complaint));
  } catch (error) {
    next(error);
  }
};

export const getMyComplaints = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { status, category, search } = req.query;
    const filter: any = { createdBy: req.user._id };

    if (typeof status === 'string' && status !== 'All' && status !== 'all') {
      const s = status.toString().toLowerCase().replace('_', ' ');
      if (s === 'pending') filter.status = 'Pending';
      else if (s === 'in progress' || s === 'in_progress') filter.status = 'In Progress';
      else if (s === 'resolved') filter.status = 'Resolved';
      else filter.status = status;
    }
    if (typeof category === 'string' && category !== 'All' && category !== 'all') {
      filter.category = category;
    }
    if (search && typeof search === 'string') {
      const literalSearch = search.slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: literalSearch, $options: 'i' } },
        { description: { $regex: literalSearch, $options: 'i' } },
        { complaintId: { $regex: literalSearch, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });

    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'Pending').length;
    const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;

    res.status(200).json(
      new ApiResponse('My complaints retrieved', {
        complaints,
        stats: { total, pending, inProgress, resolved },
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('createdBy', 'name email phone');

    if (!complaint) {
      throw new ApiError(404, 'Complaint not found');
    }

    // Citizen can only view their own complaint unless role is authority or admin
    const creatorId = (complaint.createdBy as any)?._id
      ? (complaint.createdBy as any)._id.toString()
      : (complaint.createdBy as any)?.toString();
    if (req.user.role === 'citizen' && creatorId !== req.user._id.toString()) {
      throw new ApiError(403, 'Forbidden. You do not have permission to view this complaint.');
    }

    res.status(200).json(new ApiResponse('Complaint details retrieved', complaint));
  } catch (error) {
    next(error);
  }
};
