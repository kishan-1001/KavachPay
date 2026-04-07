import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import policyRoutes from './routes/policy.js';
import userRoutes from './routes/user.js';
import sessionRoutes from './routes/session.js';
import claimRoutes from './routes/claim.js';
import adminRoutes from './routes/admin.js';

import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ Security Middleware
app.use(helmet()); // Sets various HTTP headers for security (XSS, Clickjacking, etc.)

const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Restrict to your frontend in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ⚡ Rate Limiting: Prevent brute-force and spam (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', limiter);

// Needed for accurate req.ip when deployed behind reverse proxies.
app.set('trust proxy', 1);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('KavachPay Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
