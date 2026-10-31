import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { mongoRepository, Attempt } from './models/index.js';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
try {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in the root .env file');
  const app = createApp({ repository: mongoRepository, sessionSecret: process.env.SESSION_SECRET, clientUrl: process.env.CLIENT_URL, production: process.env.NODE_ENV === 'production' });
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await Attempt.init();
  const server = app.listen(process.env.PORT || 5000, process.env.HOST || '127.0.0.1', () => console.log('AI Mystery Room API ready'));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
} catch (error) { console.error('Startup failed:', error.message); process.exit(1); }
