import { z } from 'zod';

export const boundingBoxSchema = z.object({
  className: z.string(),
  confidence: z.number(),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});

export const createComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional().default(''),
  imageUrl: z.string().min(1, 'Image is required'),
  aiDetected: z.boolean().optional().default(false),
  aiClass: z.string().optional().default(''),
  aiConfidence: z.number().min(0).max(1).optional().default(0),
  boundingBoxes: z.array(boundingBoxSchema).optional().default([]),
  latitude: z.coerce.number().default(12.9716),
  longitude: z.coerce.number().default(77.5946),
  address: z.string().optional().default('Captured Coordinates'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  complaintId: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Resolved']),
});
