import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Complaint } from '../models/Complaint';
import { ApiError } from '../utils/apiError';
import { buildAnalyticsCsv, buildAnalyticsWorkbook, AnalyticsPeriod } from '../services/analyticsExportService';

export const exportAuthorityAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = req.query.format || 'xlsx';
    const period = req.query.period || '7d';
    if (!['xlsx', 'csv'].includes(format as string) || !['7d', '30d', 'all'].includes(period as string)) throw new ApiError(400, 'Choose xlsx or csv and a 7d, 30d or all reporting period.');
    const exportedAt = new Date();
    const filter = period === 'all' ? {} : { createdAt: { $gte: new Date(exportedAt.getTime() - (period === '7d' ? 7 : 30) * 86400000) } };
    const records = await Complaint.find(filter).select('complaintId title category status priority verified createdAt updatedAt resolvedAt latitude longitude address').sort({ createdAt: -1 }).lean();
    const body = format === 'csv' ? buildAnalyticsCsv(records) : await buildAnalyticsWorkbook(records, period as AnalyticsPeriod, exportedAt);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="civictrack-operations-${period}-${exportedAt.toISOString().slice(0, 10)}.${format}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(body);
  } catch (error) { next(error); }
};
