import ExcelJS from 'exceljs';

export type AnalyticsPeriod = '7d' | '30d' | 'all';
export type AnalyticsFormat = 'xlsx' | 'csv';
export interface AnalyticsRecord {
  _id: unknown;
  complaintId?: string;
  title: string;
  category: string;
  status: string;
  priority?: string;
  verified?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string | null;
  latitude: number;
  longitude: number;
  address: string;
}

export const analyticsHeaders = ['ComplaintId', 'Title', 'Category', 'Status', 'Priority', 'Verified', 'CreatedAtUTC', 'UpdatedAtUTC', 'ResolvedAtUTC', 'ResolutionHours', 'Latitude', 'Longitude', 'Address', 'CreatedDateUTC', 'CreatedMonthUTC'];
const validDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

export function analyticsRows(records: AnalyticsRecord[]) {
  return records.map(record => {
    const created = validDate(record.createdAt);
    const resolved = validDate(record.resolvedAt);
    const hours = record.status === 'Resolved' && created && resolved && resolved >= created ? (resolved.getTime() - created.getTime()) / 3600000 : null;
    return [record.complaintId || String(record._id), record.title, record.category || 'other', record.status, record.priority || '', !!record.verified,
      created, validDate(record.updatedAt), resolved, hours, Number.isFinite(record.latitude) ? record.latitude : null,
      Number.isFinite(record.longitude) ? record.longitude : null, record.address, created?.toISOString().slice(0, 10) || '', created?.toISOString().slice(0, 7) || ''];
  });
}

// Quote every CSV cell; neutralize spreadsheet formulas only in text fields.
// Real negative coordinates remain numbers, and timestamps retain explicit UTC.
function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : value == null ? '' : String(value);
  if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildAnalyticsCsv(records: AnalyticsRecord[]): Buffer {
  return Buffer.from('\uFEFF' + [analyticsHeaders, ...analyticsRows(records)].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n', 'utf8');
}

export async function buildAnalyticsWorkbook(records: AnalyticsRecord[], period: AnalyticsPeriod, exportedAt: Date): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CivicTrack';
  workbook.created = exportedAt;
  workbook.calcProperties.fullCalcOnLoad = true;
  const summary = workbook.addWorksheet('Operations Summary', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const incidents = workbook.addWorksheet('Incidents', { views: [{ state: 'frozen', ySplit: 1 }] });
  const rows = analyticsRows(records);
  incidents.addTable({ name: 'Incidents', ref: 'A1', headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: analyticsHeaders.map(name => ({ name, filterButton: true })), rows });
  const widths = [21, 42, 24, 18, 14, 12, 23, 23, 23, 20, 15, 15, 58, 18, 19];
  incidents.columns.forEach((column, index) => { column.width = widths[index]; });
  incidents.getRow(1).height = 30;
  incidents.eachRow((row, index) => {
    if (index === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
    for (const column of [7, 8, 9]) row.getCell(column).numFmt = 'yyyy-mm-dd hh:mm';
    row.getCell(10).numFmt = '0.00';
    row.getCell(11).numFmt = '0.00000';
    row.getCell(12).numFmt = '0.00000';
  });

  summary.columns = [{ width: 32 }, { width: 22 }, { width: 4 }, { width: 28 }, { width: 14 }, { width: 18 }];
  summary.mergeCells('A1:F1');
  summary.getCell('A1').value = 'CivicTrack | Operations Analytics';
  summary.getCell('A1').font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  summary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7F1416' } };
  summary.getRow(1).height = 40;
  summary.mergeCells('A2:F2');
  summary.getCell('A2').value = `Created-date period: ${period === 'all' ? 'All time' : period === '7d' ? 'Last 7 days' : 'Last 30 days'} | Exported ${exportedAt.toISOString()} (UTC)`;
  summary.getCell('A2').font = { size: 10, color: { argb: 'FF52525B' } };
  summary.getCell('A2').alignment = { wrapText: true };
  summary.getRow(2).height = 30;
  summary.getCell('A4').value = 'Metric'; summary.getCell('B4').value = 'Value';
  summary.getCell('D4').value = 'Category'; summary.getCell('E4').value = 'Reports';
  const last = Math.max(2, records.length + 1);
  const range = (column: string) => `Incidents!${column}2:${column}${last}`;
  const count = (status: string) => records.filter(record => record.status === status).length;
  const durationValues = rows.map(row => row[9]).filter((value): value is number => typeof value === 'number');
  const metrics: [string, string, number | string][] = [
    ['Total incidents', `COUNTA(${range('A')})`, records.length],
    ['Pending', `COUNTIF(${range('D')},"Pending")`, count('Pending')],
    ['In progress', `COUNTIF(${range('D')},"In Progress")`, count('In Progress')],
    ['Resolved', `COUNTIF(${range('D')},"Resolved")`, count('Resolved')],
    ['High / urgent priority', `COUNTIF(${range('E')},"high")+COUNTIF(${range('E')},"urgent")`, records.filter(record => ['high', 'urgent'].includes(record.priority || '')).length],
    ['Verified', `COUNTIF(${range('F')},TRUE)`, records.filter(record => record.verified).length],
    ['Resolution rate', 'IF(B5=0,0,B8/B5)', records.length ? count('Resolved') / records.length : 0],
    ['Average resolution hours', `IF(COUNT(${range('J')})=0,"Not available",AVERAGE(${range('J')}))`, durationValues.length ? durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length : 'Not available'],
  ];
  metrics.forEach(([label, formula, result], index) => {
    summary.getCell(`A${index + 5}`).value = label;
    summary.getCell(`B${index + 5}`).value = { formula, result };
    summary.getRow(index + 5).height = 26;
  });
  summary.getCell('B11').numFmt = '0.0%';
  summary.getCell('B12').numFmt = '0.00';
  const categories = [...new Set(records.map(record => record.category || 'other'))].sort();
  categories.forEach((category, index) => {
    summary.getCell(`D${index + 5}`).value = category.replace(/_/g, ' ');
    const escaped = category.replace(/"/g, '""').replace(/~/g, '~~').replace(/\*/g, '~*').replace(/\?/g, '~?');
    summary.getCell(`E${index + 5}`).value = { formula: `COUNTIF(${range('C')},"${escaped}")`, result: records.filter(record => (record.category || 'other') === category).length };
  });
  if (!categories.length) summary.getCell('D5').value = 'No incidents in this period';
  for (const cell of ['A4', 'B4', 'D4', 'E4']) {
    summary.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F4' } };
    summary.getCell(cell).font = { bold: true, color: { argb: 'FF18181B' } };
  }
  const notesRow = Math.max(15, categories.length + 7);
  summary.mergeCells(`A${notesRow}:F${notesRow + 2}`);
  summary.getCell(`A${notesRow}`).value = 'Current recorded status, filtered by complaint creation time. All timestamps are UTC. Average resolution hours excludes missing, invalid or reversed timestamps. Ward assignments and SLA deadlines are not recorded. Personal contact information is excluded. Import the Incidents table into Power BI.';
  summary.getCell(`A${notesRow}`).alignment = { wrapText: true, vertical: 'top' };
  summary.getCell(`A${notesRow}`).font = { size: 10, color: { argb: 'FF52525B' } };
  summary.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
