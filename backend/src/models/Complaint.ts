import mongoose, { Schema, Document } from 'mongoose';

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

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IBoundingBox {
  className: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  complaintId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  customCategory?: string;
  imageUrl: string;
  aiDetected: boolean;
  aiClass?: string;
  aiConfidence: number;
  boundingBoxes: IBoundingBox[];
  latitude: number;
  longitude: number;
  address: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  createdBy: mongoose.Types.ObjectId;
  citizenId?: mongoose.Types.ObjectId;
  officerId?: mongoose.Types.ObjectId | null;
  verified: boolean;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BoundingBoxSchema = new Schema<IBoundingBox>(
  {
    className: { type: String, required: true },
    confidence: { type: Number, required: true },
    x1: { type: Number, required: true },
    y1: { type: Number, required: true },
    x2: { type: Number, required: true },
    y2: { type: Number, required: true },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    customCategory: { type: String, trim: true, default: '' },
    imageUrl: { type: String, required: true },
    aiDetected: { type: Boolean, default: false },
    aiClass: { type: String, trim: true, default: '' },
    aiConfidence: { type: Number, required: true, default: 0 },
    boundingBoxes: [BoundingBoxSchema],
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true, default: 'Location details captured' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verified: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual citizenId pointing to createdBy
ComplaintSchema.virtual('citizenId').get(function () {
  return this.createdBy;
});

// Pre-save auto-generate complaintId if not present (CIV-100245)
ComplaintSchema.pre('validate', function (next) {
  if (!this.complaintId) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.complaintId = `CIV-${randomNum}`;
  }
  next();
});

ComplaintSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret: Record<string, any>) {
    delete ret.__v;
    return ret;
  },
});

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
