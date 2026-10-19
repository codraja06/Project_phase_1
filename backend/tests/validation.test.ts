import { registerSchema, changePasswordSchema } from '../src/validators/authValidator';
import { createComplaintSchema, boundingBoxSchema } from '../src/validators/complaintValidator';

describe('Input boundary regressions', () => {
  const account = { name: 'Test Citizen', email: 'boundaries@example.test', phone: '1234567890' };
  const complaint = { title: 'Road damage', description: 'Road surface needs inspection', category: 'pothole', imageUrl: 'https://example.test/photo.jpg', latitude: 0, longitude: 0 };

  it('rejects passwords that bcrypt would silently truncate, including multibyte text', () => {
    expect(registerSchema.safeParse({ ...account, password: 'x'.repeat(73) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...account, password: '界'.repeat(25) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...account, password: '界'.repeat(24) }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ oldPassword: 'password123', newPassword: 'x'.repeat(73) }).success).toBe(false);
  });

  it.each([-1, 101, Infinity])('rejects out-of-range AI confidence %s', aiConfidence => {
    expect(createComplaintSchema.safeParse({ ...complaint, aiConfidence }).success).toBe(false);
    expect(boundingBoxSchema.safeParse({ confidence: aiConfidence }).success).toBe(false);
  });

  it('preserves percentage compatibility and zero-valued coordinates', () => {
    const result = createComplaintSchema.parse({ ...complaint, aiConfidence: 91 });
    expect(result.aiConfidence).toBe(0.91);
    expect(result.latitude).toBe(0);
    expect(result.longitude).toBe(0);
  });

  it('rejects blank text and reversed or non-finite image coordinates', () => {
    expect(createComplaintSchema.safeParse({ ...complaint, title: '   ' }).success).toBe(false);
    expect(createComplaintSchema.safeParse({ ...complaint, description: '     ' }).success).toBe(false);
    expect(boundingBoxSchema.safeParse({ x1: 20, x2: 10, y1: 0, y2: 5 }).success).toBe(false);
    expect(boundingBoxSchema.safeParse({ x1: Infinity }).success).toBe(false);
  });
});
