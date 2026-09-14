import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './config/env';
import { User } from './models/User';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Citizen
  await User.findOneAndUpdate(
    { email: 'citizen@example.com' },
    {
      name: 'Test Citizen',
      email: 'citizen@example.com',
      phone: '9876543210',
      password: hashedPassword,
      role: 'citizen',
    },
    { upsert: true, new: true }
  );

  // Authority / Officer
  await User.findOneAndUpdate(
    { email: 'officer@city.gov' },
    {
      name: 'Municipal Officer',
      email: 'officer@city.gov',
      phone: '9876543211',
      password: hashedPassword,
      role: 'authority',
    },
    { upsert: true, new: true }
  );

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
