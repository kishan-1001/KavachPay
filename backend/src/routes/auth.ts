import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import prisma from '../prismaClient.js';
import { JWT_SECRET } from '../config.js';
import xss from 'xss';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let disposableEmails: string[] = [];
try {
  const filePath = path.join(__dirname, '../../disposable_emails.json');
  disposableEmails = JSON.parse(readFileSync(filePath, 'utf-8'));
} catch (e) {
  console.error('Could not load disposable_emails.json', e);
}

const isDisposable = (email: string) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && disposableEmails.includes(domain);
};
const router = express.Router();

const sendOtpEmail = async (email: string, subject: string, htmlContent: string) => {
  // Read at call time (not module load time) so dotenv has already run
  const apiKey = process.env.BREVO_API_KEY || '';
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@kavachpay.com';

  if (!apiKey) {
    throw new Error('Email service is not configured.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'KavachPay Security', email: senderEmail },
      to: [{ email }],
      subject,
      htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo email send failed: ${response.status} ${errorText}`);
  }
};

// 1. Send OTP via Brevo Email
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    if (isDisposable(email)) {
      res.status(400).json({ error: 'baby ctrl alt elite is not dumpt 😂🤣 use a valid mail id' });
      return;
    }

    // Rate Limiting: Check if an OTP was sent in the last 30 seconds
    const lastOtp = await prisma.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp && (Date.now() - lastOtp.createdAt.getTime()) < 30000) {
      res.status(429).json({ error: 'Please wait 30 seconds before requesting another OTP.' });
      return;
    }

    // Generate 6-digit OTP using cryptographically secure random number generator
    const otp = randomInt(100000, 1000000).toString();

    // Invalidate previous unverified OTPs
    await prisma.otpVerification.deleteMany({
      where: { email, verified: false }
    });

    // Save to DB with 1-minute expiration
    await prisma.otpVerification.create({
      data: {
        email,
        otpCode: otp,
        expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute
      }
    });

    const otpHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; text-align: center;">KavachPay Verification</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">To complete your registration, please use the following unique verification code:</p>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">${otp}</span>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">Note: This code will expire in 60 seconds.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendOtpEmail(email, `${otp} is your KavachPay verification code`, otpHtml);
    } catch (emailError) {
      await prisma.otpVerification.deleteMany({
        where: { email, otpCode: otp, verified: false }
      });
      console.error('Registration OTP email failed:', emailError);
      res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
      return;
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 2. Verify OTP for Signup
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const record = await prisma.otpVerification.findFirst({
      where: { email, otpCode: otp, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      res.status(400).json({ error: 'Invalid verification code.' });
      return;
    }

    if (new Date() > record.expiresAt) {
      res.status(400).json({ error: 'This code has expired. Please request a new one.' });
      return;
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true }
    });

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// 2b. Send OTP for Login
router.post('/login-send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(404).json({ error: 'No account found with this email. Please sign up first!' });
      return;
    }

    // Rate Limiting
    const lastOtp = await prisma.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp && (Date.now() - lastOtp.createdAt.getTime()) < 30000) {
      res.status(429).json({ error: 'Please wait 30 seconds.' });
      return;
    }

    const otp = randomInt(100000, 1000000).toString();

    await prisma.otpVerification.deleteMany({
      where: { email, verified: false }
    });

    await prisma.otpVerification.create({
      data: {
        email,
        otpCode: otp,
        expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute
      }
    });

    const otpHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; text-align: center;">KavachPay Login</h2>
        <p style="color: #475569;">You requested a login code. Use the code below to sign in:</p>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">${otp}</span>
        </div>
        <p style="color: #ef4444; font-size: 14px;">Valid for 60 seconds.</p>
      </div>
    `;

    try {
      await sendOtpEmail(email, `${otp} is your login code`, otpHtml);
    } catch (emailError) {
      await prisma.otpVerification.deleteMany({
        where: { email, otpCode: otp, verified: false }
      });
      console.error('Login OTP email failed:', emailError);
      res.status(500).json({ error: 'Failed to send login code. Please try again.' });
      return;
    }

    res.json({ message: 'Login OTP sent!' });
  } catch (error) {
    console.error('Login Send OTP Error:', error);
    res.status(500).json({ error: 'Failed to send login code.' });
  }
});

// 2c. Verify OTP for Login
router.post('/login-verify', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const record = await prisma.otpVerification.findFirst({
      where: { email, otpCode: otp, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || new Date() > record.expiresAt) {
      res.status(400).json({ error: 'Invalid or expired login code.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Overwrite any old verifications
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, city: user.city },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        city: user.city,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login Verify Error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// 3. User Registration Route
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      city,
      deliveryPlatform,
      vehicleType,
      weeklyEarnings,
      upiId,
    } = req.body;

    if (!fullName || !email || !city || !deliveryPlatform || !vehicleType || !weeklyEarnings) {
      res.status(400).json({ error: 'Required fields are missing.' });
      return;
    }

    if (isDisposable(email)) {
      res.status(400).json({ error: 'baby we are not dumb 😂🤣 use a valid mail id' });
      return;
    }

    // 🧹 Robust Input Sanitization (XSS Prevention)
    const cleanFullName = xss(fullName).trim();
    const cleanUpiId = xss(upiId || '').trim();

    // Check verification
    const verification = await prisma.otpVerification.findFirst({
      where: { email, verified: true },
    });

    if (!verification) {
      res.status(403).json({ error: 'Email not verified.' });
      return;
    }

    // Check if this email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        error: 'This email is already registered. Please sign in instead.',
      });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        fullName: cleanFullName,
        email,
        phoneNumber,
        city,
        deliveryPlatform,
        vehicleType,
        weeklyEarnings: Number(weeklyEarnings),
        upiId: cleanUpiId,
        isVerified: true,
      },
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, city: newUser.city },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration complete!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        city: newUser.city,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error detailed:', error);
    // Catch any remaining unique constraint errors as a safety net
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
      return;
    }
    res.status(500).json({ error: `Server error during registration: ${error.message || 'Unknown error'}` });
  }
});

export default router;
