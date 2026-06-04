import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Login endpoint
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Query user from database
      const result = await query(
        'SELECT user_id, username, email, role, password_hash, is_active FROM customer.user_auth WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          timestamp: new Date().toISOString(),
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          code: 'USER_INACTIVE',
          message: 'User account is inactive',
          timestamp: new Date().toISOString(),
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          timestamp: new Date().toISOString(),
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken(user.user_id);

      // Store refresh token
      const tokenHash = await hashPassword(refreshToken);
      await query(
        'INSERT INTO customer.refresh_tokens (token_id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'24 hours\')',
        [uuidv4(), user.user_id, tokenHash]
      );

      // Update last login
      await query('UPDATE customer.user_auth SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

      res.status(200).json({
        accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_EXPIRE || '3600'),
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Refresh token endpoint
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { refreshToken } = req.body;

      try {
        const decoded = verifyRefreshToken(refreshToken);
        const userId = decoded.userId;

        // Get user details
        const result = await query(
          'SELECT user_id, username, email, role FROM customer.user_auth WHERE user_id = $1',
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token',
            timestamp: new Date().toISOString(),
          });
        }

        const user = result.rows[0];

        const newAccessToken = generateAccessToken({
          userId: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
        });

        const newRefreshToken = generateRefreshToken(user.user_id);

        res.status(200).json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: parseInt(process.env.JWT_EXPIRE || '3600'),
          user: {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        return res.status(401).json({
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Token refresh failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Invalidate refresh tokens
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Token invalidation logic can be added here
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Logout failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
