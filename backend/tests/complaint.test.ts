import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Complaint } from '../src/models/Complaint';
import { generateToken } from '../src/utils/jwt';
import { env } from '../src/config/env';

jest.setTimeout(30000);

describe('Complaint API Endpoints (Citizen)', () => {
  let citizenToken: string;
  let citizenId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: 'citizen@example.com' });
    await Complaint.deleteMany({ title: /Test|Pothole|Road/ });

    const citizen = await User.create({
      name: 'Test Citizen',
      email: 'citizen@example.com',
      phone: '1234567890',
      password: 'password123',
      role: 'citizen',
    });
    citizenId = citizen._id.toString();
    citizenToken = generateToken({ userId: citizenId, role: 'citizen' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new complaint as citizen', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Large Pothole on Main St',
        description: 'Dangerous pothole near the intersection causing traffic slowdown.',
        category: 'pothole',
        imageUrl: 'http://example.com/pothole.jpg',
        aiConfidence: 0.92,
        boundingBoxes: [
          { className: 'pothole', confidence: 0.92, x1: 100, y1: 150, x2: 400, y2: 350 },
        ],
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Main Street, Bangalore',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Large Pothole on Main St');
    expect(res.body.data.status).toBe('Pending');
  });

  it('should list citizen own complaints', async () => {
    await Complaint.create({
      title: 'Road Damage',
      description: 'Cracks on road',
      category: 'road_damage',
      imageUrl: 'http://example.com/road.jpg',
      latitude: 12.97,
      longitude: 77.59,
      address: 'City Center',
      createdBy: citizenId,
    });

    const res = await request(app)
      .get('/api/complaints/my')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complaints.length).toBeGreaterThanOrEqual(1);
  });

  it('retries a public reference collision without losing the complaint', async () => {
    const create = jest.spyOn(Complaint, 'create');
    create.mockRejectedValueOnce({ code: 11000, keyPattern: { complaintId: 1 } });
    try {
      const res = await request(app).post('/api/complaints').set('Authorization', `Bearer ${citizenToken}`).send({
        title: 'Test collision recovery', description: 'Road surface needs inspection', category: 'pothole',
        imageUrl: 'https://example.test/photo.jpg', latitude: 0, longitude: 0,
      });
      expect(res.status).toBe(201);
      expect(create).toHaveBeenCalledTimes(2);
      expect(await Complaint.countDocuments({ title: 'Test collision recovery' })).toBe(1);
    } finally {
      create.mockRestore();
    }
  });
});
