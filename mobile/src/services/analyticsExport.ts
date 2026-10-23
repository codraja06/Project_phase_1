import { axiosClient } from '../api/axiosClient';
import { saveExportFile } from './saveExportFile';

export type AnalyticsFormat = 'xlsx' | 'csv';
export type AnalyticsPeriod = '7d' | '30d' | 'all';

export async function exportOperationsAnalytics(period: AnalyticsPeriod, format: AnalyticsFormat): Promise<void> {
  const bytes = await axiosClient.get<ArrayBuffer, ArrayBuffer>('/authority/analytics/export', { params: { period, format }, responseType: 'arraybuffer', timeout: 60000 });
  const mimeType = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
  await saveExportFile(bytes, `civictrack-operations-${period}-${new Date().toISOString().slice(0, 10)}.${format}`, mimeType);
}
