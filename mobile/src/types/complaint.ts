import { DetectionResult } from './ai';

export type ComplaintCategory =
  | 'pothole'
  | 'road_damage'
  | 'garbage'
  | 'garbage_overflow'
  | 'broken_streetlight'
  | 'drainage'
  | 'drainage_problem'
  | 'water_leakage'
  | 'other'
  | string;

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ComplaintUserRef {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Complaint {
  _id: string;
  complaintId?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  customCategory?: string;
  imageUrl: string;
  aiDetected?: boolean;
  aiClass?: string;
  aiConfidence: number;
  boundingBoxes: DetectionResult[];
  latitude: number;
  longitude: number;
  address: string;
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  verified?: boolean;
  createdBy?: string | ComplaintUserRef;
  citizenId?: string | ComplaintUserRef;
  officerId?: string | ComplaintUserRef | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  highPriority?: number;
  today?: number;
  verifiedCount?: number;
  categoryStats?: Record<string, number>;
}
