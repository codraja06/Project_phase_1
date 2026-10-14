import fs from 'fs';
import os from 'os';
import path from 'path';
import { uploadToCloudinary } from '../src/services/cloudinaryService';
import { cloudinary } from '../src/config/cloudinary';
import { env } from '../src/config/env';

jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { upload: jest.fn() } },
}));
jest.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'production',
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_API_KEY: '',
    CLOUDINARY_API_SECRET: '',
    BACKEND_PUBLIC_URL: 'https://example.onrender.com',
  },
}));

describe('production image storage', () => {
  const files: string[] = [];

  const newImage = (): string => {
    const file = path.join(os.tmpdir(), `civictrack-upload-${Date.now()}-${Math.random()}.jpg`);
    fs.writeFileSync(file, 'test image');
    files.push(file);
    return file;
  };

  afterEach(() => {
    for (const file of files) if (fs.existsSync(file)) fs.unlinkSync(file);
    files.length = 0;
    jest.clearAllMocks();
  });

  it('does not publish an ephemeral URL when credentials are missing', async () => {
    const file = newImage();
    await expect(uploadToCloudinary(file)).rejects.toMatchObject({ statusCode: 503 });
    expect(fs.existsSync(file)).toBe(false);
    expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
  });

  it('does not publish an ephemeral URL when Cloudinary rejects the upload', async () => {
    env.CLOUDINARY_CLOUD_NAME = 'test';
    env.CLOUDINARY_API_KEY = 'test';
    env.CLOUDINARY_API_SECRET = 'test';
    (cloudinary.uploader.upload as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
    const file = newImage();

    await expect(uploadToCloudinary(file)).rejects.toMatchObject({ statusCode: 503 });
    expect(fs.existsSync(file)).toBe(false);
  });
});
