import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Complaint } from '../src/models/Complaint';
import { generateToken } from '../src/utils/jwt';
import { env } from '../src/config/env';

jest.setTimeout(30000);
describe('Audit regressions: access control and input integrity', () => {
  let token: string;
  beforeAll(async () => {
    expect(env.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/civictrack_isolated_test');
    await mongoose.connect(env.MONGODB_URI);
    await User.deleteMany({ email: 'audit-citizen@example.test' });
    const user = await User.create({ name: 'Audit Citizen', email: 'audit-citizen@example.test', password: 'test-password', role: 'citizen' });
    token = generateToken({ userId: user._id.toString(), role: 'citizen' });
  });
  afterAll(async () => { await mongoose.disconnect(); });
  it('rejects public officer registration', async () => {
    const res = await request(app).post('/api/auth/register').send({ name:'Unauthorized Officer', email:'audit-officer@example.test', password:'password123',phone:'1234567890',role:'authority' });
    expect(res.status).toBe(400);
    expect(await User.findOne({ email:'audit-officer@example.test' })).toBeNull();
  });
  it('rejects unverified Google profile data', async () => {
    const res = await request(app).post('/api/auth/google').send({ role:'authority',userInfo:{email:'forged@example.test',name:'Forged',id:'fake'} });
    expect(res.status).toBe(401);
  });
  it('returns validation errors as 400, without inventing coordinates', async () => {
    const res = await request(app).post('/api/complaints').set('Authorization',`Bearer ${token}`).send({title:'Missing location',description:'Valid description',category:'pothole',imageUrl:'https://example.com/test.jpg'});
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: any)=>e.field==='latitude')).toBe(true);
  });
  it('rejects temporary browser image URLs and invalid coordinates', async () => {
    const res = await request(app).post('/api/complaints').set('Authorization',`Bearer ${token}`).send({title:'Invalid upload',description:'Valid description',category:'pothole',imageUrl:'blob:local-only',latitude:91,longitude:181});
    expect(res.status).toBe(400);
  });
  it('handles invalid record identifiers without an internal error', async () => {
    const res = await request(app).get('/api/complaints/not-an-id').set('Authorization',`Bearer ${token}`);
    expect(res.status).toBe(400);
  });
  it('denies access when the complaint owner no longer exists', async () => {
    const orphan = await Complaint.create({title:'Audit orphan',description:'Deleted owner test',category:'pothole',imageUrl:'https://example.com/photo.jpg',latitude:0,longitude:0,createdBy:new mongoose.Types.ObjectId()});
    const res = await request(app).get(`/api/complaints/${orphan._id}`).set('Authorization',`Bearer ${token}`);
    expect(res.status).toBe(403);
  });
  it('treats regular-expression metacharacters as literal search text', async () => {
    const res = await request(app).get('/api/complaints/my').query({search:'['}).set('Authorization',`Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.complaints).toEqual([]);
  });
  it('rejects active SVG content and files disguised as images', async () => {
    const svg=await request(app).post('/api/uploads/image').set('Authorization',`Bearer ${token}`).attach('image',Buffer.from('<svg onload="alert(1)"/>'),{filename:'bad.svg',contentType:'image/svg+xml'});
    expect(svg.status).toBe(400);
    const fake=await request(app).post('/api/uploads/image').set('Authorization',`Bearer ${token}`).attach('image',Buffer.from('<html>Not an image</html>'),{filename:'bad.jpg',contentType:'image/jpeg'});
    expect(fake.status).toBe(400);
  });
});
