import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`==================================================`);
    console.log(` Civic Complaint Backend API Server`);
    console.log(` Running on port: ${env.PORT}`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` AI Microservice URL: ${env.AI_SERVICE_URL}`);
    console.log(`==================================================`);
  });
};

startServer();
