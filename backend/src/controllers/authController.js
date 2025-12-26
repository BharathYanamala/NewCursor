import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Ensure environment variables are loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Register new user
async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role = 'participant' } = req.body;

    // Normalize email (trim and lowercase for consistency)
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: email },
          { username: normalizedUsername },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Hash password - ensure password is a string and not empty
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ error: 'Password is required' });
    }
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Create user with normalized email
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'participant'
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Login user
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    console.log('Password provided:', password ? 'Yes (length: ' + password.length + ')' : 'No');

    // Normalize email (trim and lowercase for consistency)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user - try exact match first, then normalized
    let user = await prisma.user.findUnique({
      where: { email: email }
    });

    // If not found with exact match, try normalized email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
    }

    if (!user) {
      console.log('Login failed: User not found for email:', email);
      // List available emails for debugging
      const allUsers = await prisma.user.findMany({ select: { email: true } });
      console.log('Available emails in database:', allUsers.map(u => u.email));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user.email, 'Password hash exists:', !!user.passwordHash);

    // Verify password - ensure we're comparing trimmed passwords
    const trimmedPassword = password.trim();
    const isValidPassword = await bcrypt.compare(trimmedPassword, user.passwordHash);
    console.log('Password comparison result:', isValidPassword);
    console.log('Comparing password length:', trimmedPassword.length, 'with hash:', user.passwordHash.substring(0, 20) + '...');

    if (!isValidPassword) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for user:', user.email);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Forgot password - request password reset
async function forgotPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Always return success message to prevent email enumeration
    // In production, you would send an email here
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: expiresAt
      }
    });

    // In production, send email with reset link
    // For development, we'll return the token in the response
    // In production, remove this and send email instead
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    console.log('Password reset link for', normalizedEmail, ':', resetLink);

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Only include in development
      ...(process.env.NODE_ENV === 'development' && {
        resetToken: resetToken,
        resetLink: resetLink
      })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

// Reset password with token
async function resetPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find valid reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token: token },
      include: { user: true }
    });

    if (!passwordReset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (new Date() > passwordReset.expiresAt) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Check if token has already been used
    if (passwordReset.used) {
      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash: passwordHash }
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true }
      })
    ]);

    res.json({
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

// Validate token - check if current token is still valid
async function validateToken(req, res) {
  try {
    // If we reach here, the token is valid (authenticateToken middleware passed)
    // Return current user info
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
}

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Invalid email address')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export {
  register,
  login,
  forgotPassword,
  resetPassword,
  validateToken,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};

