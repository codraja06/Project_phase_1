// Tests must never connect to the application's configured database.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/civictrack_isolated_test';
process.env.JWT_SECRET = 'isolated-test-signing-key-not-used-by-application';
