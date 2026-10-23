import ExcelJS from 'exceljs';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Complaint } from '../src/models/Complaint';
import { generateToken } from '../src/utils/jwt';
import { env } from '../src/config/env';
import { AnalyticsRecord, buildAnalyticsCsv, buildAnalyticsWorkbook } from '../src/services/analyticsExportService';

const now = new Date('2026-10-19T12:00:00Z');
const record: AnalyticsRecord = { _id: 'sample-id', complaintId: 'CIV-EXPORTED', title: '=HYPERLINK("bad")', category: 'pothole', status: 'Resolved', priority: 'high', verified: true,
  createdAt: new Date('2026-10-19T08:00:00Z'), updatedAt: now, resolvedAt: now, latitude: -33.9, longitude: 151.2, address: 'சென்னை, "Main road"\nNear the park' };

describe('Operations export serialization', () => {
  it('writes Tamil and quoted multiline text without executable CSV formulas, retaining negative numbers', () => {
    const csv = buildAnalyticsCsv([record]).toString('utf8');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('சென்னை, ""Main road""\nNear the park');
    expect(csv).toContain('"-33.9"');
    expect(csv).toContain('"2026-10-19T08:00:00.000Z"');
  });

  it('produces a genuine XLSX with typed records, an importable table and cached summary formulas', async () => {
    const bytes = await buildAnalyticsWorkbook([record], '7d', now);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as any);
    const details = workbook.getWorksheet('Incidents')!;
    expect(details.getTable('Incidents')).toBeDefined();
    expect(details.getCell('B2').value).toBe(record.title); // typed string, not a formula
    expect(details.getCell('G2').value).toBeInstanceOf(Date);
    expect(details.getCell('J2').value).toBe(4);
    expect(details.getCell('K2').value).toBe(-33.9);
    expect(workbook.getWorksheet('Operations Summary')!.getCell('B11').result).toBe(1);
    expect(workbook.getWorksheet('Operations Summary')!.getCell('B12').result).toBe(4);
  });

  it('exports empty datasets and excludes invalid or unresolved resolution intervals', async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await buildAnalyticsWorkbook([], 'all', now) as any);
    expect(workbook.getWorksheet('Operations Summary')!.getCell('B5').result).toBe(0);
    expect(workbook.getWorksheet('Operations Summary')!.getCell('B12').result).toBe('Not available');
    const csv = buildAnalyticsCsv([{ ...record, resolvedAt: '2026-10-18T08:00:00Z' }, { ...record, status: 'Pending' }]).toString('utf8');
    expect(csv).not.toContain('"4"');
    expect(csv).not.toContain('"-24"');
  });
});

describe('Operations export API', () => {
  let authorityToken: string;
  let citizenToken: string;
  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await User.deleteMany({ email: /export-audit@example\.test$/ });
    await Complaint.deleteMany({ title: /^Export audit / });
    const citizen = await User.create({ name: 'Export Citizen', email: 'citizen-export-audit@example.test', phone: '9876543210', password: 'ExportPassword123!', role: 'citizen' });
    const officer = await User.create({ name: 'Export Officer', email: 'officer-export-audit@example.test', phone: '9876543211', password: 'ExportPassword123!', role: 'authority' });
    citizenToken = generateToken({ userId: String(citizen._id), role: 'citizen' });
    authorityToken = generateToken({ userId: String(officer._id), role: 'authority' });
    for (const [code, age] of [['CIV-EXPORT-RECENT', 1], ['CIV-EXPORT-OLD', 20]] as const) {
      await Complaint.create({ title: `Export audit ${age}`, complaintId: code, description: 'Isolated export test', category: 'pothole', imageUrl: 'https://example.test/image.png', latitude: 12.9, longitude: 80.1, address: 'சென்னை', createdBy: citizen._id, createdAt: new Date(Date.now() - age * 86400000) });
    }
  }, 30000);
  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await Complaint.deleteMany({ title: /^Export audit / });
      await User.deleteMany({ email: /export-audit@example\.test$/ });
    }
    await mongoose.disconnect();
  });

  it('requires an authenticated Officer', async () => {
    expect((await request(app).get('/api/authority/analytics/export')).status).toBe(401);
    expect((await request(app).get('/api/authority/analytics/export').set('Authorization', `Bearer ${citizenToken}`)).status).toBe(403);
  });
  it('validates format and reporting period', async () => {
    for (const query of ['format=pbix', 'period=invalid', 'format[]=csv']) {
      const result = await request(app).get(`/api/authority/analytics/export?${query}`).set('Authorization', `Bearer ${authorityToken}`);
      expect(result.status).toBe(400);
    }
  });
  it('filters by creation time and returns a private UTF-8 CSV attachment', async () => {
    const result = await request(app).get('/api/authority/analytics/export?format=csv&period=7d').set('Authorization', `Bearer ${authorityToken}`);
    expect(result.status).toBe(200);
    expect(result.headers['content-disposition']).toContain('.csv');
    expect(result.headers['cache-control']).toBe('private, no-store');
    expect(result.text).toContain('CIV-EXPORT-RECENT');
    expect(result.text).not.toContain('CIV-EXPORT-OLD');
    expect(result.text).not.toContain('citizen-export-audit');
    const all = await request(app).get('/api/authority/analytics/export?format=csv&period=all').set('Authorization', `Bearer ${authorityToken}`);
    expect(all.text).toContain('CIV-EXPORT-OLD');
  });
  it('returns a real Excel download', async () => {
    const result = await request(app).get('/api/authority/analytics/export?format=xlsx&period=all').set('Authorization', `Bearer ${authorityToken}`)
      .buffer(true).parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', chunk => chunks.push(Buffer.from(chunk)));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
        response.on('error', callback);
      });
    expect(result.status).toBe(200);
    expect(result.body.subarray(0, 2).toString()).toBe('PK');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.body);
    expect(workbook.getWorksheet('Incidents')).toBeDefined();
  });
});
