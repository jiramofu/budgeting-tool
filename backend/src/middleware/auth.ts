import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  userId?: number;
  user?: { email: string };
  file?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    req.userId = decoded.userId;

    try {
      const userResult = await query('SELECT email FROM users WHERE id = $1', [decoded.userId]);
      if (userResult.rows[0]) {
        req.user = { email: userResult.rows[0].email };
      }
    } catch (err) {
      console.error('Error fetching user email:', err);
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
