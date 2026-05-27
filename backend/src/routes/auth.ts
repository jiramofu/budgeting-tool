import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { query } from '../config/database';
import { config } from '../config/env';

const router = Router();

console.log('[Auth Routes] Loading auth routes...');

const DEFAULT_CATEGORIES = [
  // Fixed Expenses
  { name: 'Rent/Mortgage', type: 'fixed', color: '#3b82f6', icon: '🏠' },
  { name: 'Insurance', type: 'fixed', color: '#3b82f6', icon: '🛡️' },
  { name: 'Utilities', type: 'fixed', color: '#3b82f6', icon: '💡' },
  { name: 'Phone/Internet', type: 'fixed', color: '#3b82f6', icon: '📱' },
  // Variable Expenses
  { name: 'Groceries', type: 'variable', color: '#ef4444', icon: '🛒' },
  { name: 'Dining Out', type: 'variable', color: '#ef4444', icon: '🍽️' },
  { name: 'Transportation', type: 'variable', color: '#ef4444', icon: '🚗' },
  { name: 'Gas', type: 'variable', color: '#ef4444', icon: '⛽' },
  { name: 'Entertainment', type: 'variable', color: '#ef4444', icon: '🎬' },
  { name: 'Shopping', type: 'variable', color: '#ef4444', icon: '🛍️' },
  { name: 'Health & Wellness', type: 'variable', color: '#ef4444', icon: '💪' },
  { name: 'Personal Care', type: 'variable', color: '#ef4444', icon: '💇' },
  // Recurring Expenses
  { name: 'Subscriptions', type: 'recurring', color: '#10b981', icon: '📺' },
  { name: 'Gym Membership', type: 'recurring', color: '#10b981', icon: '🏋️' },
  { name: 'Software/Apps', type: 'recurring', color: '#10b981', icon: '💻' },
  { name: 'Donations', type: 'recurring', color: '#10b981', icon: '❤️' },
];

async function seedDefaultCategories(userId: number): Promise<void> {
  try {
    console.log('[Auth] Seeding default categories for user:', userId);
    for (const category of DEFAULT_CATEGORIES) {
      await query(
        'INSERT INTO categories (user_id, name, type, color, icon) VALUES ($1, $2, $3, $4, $5)',
        [userId, category.name, category.type, category.color, category.icon]
      );
    }
    console.log('[Auth] Default categories seeded successfully');
  } catch (error) {
    console.error('[Auth] Error seeding categories:', error);
  }
}

async function initializeUserSettings(userId: number): Promise<void> {
  try {
    console.log('[Auth] Initializing default user settings for user:', userId);
    await query(
      `INSERT INTO user_settings (user_id, theme, currency, date_format, default_budgeting_method,
                                 email_notifications, push_notifications, two_factor_enabled, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, 'light', 'USD', 'MM/DD/YYYY', 'flex', true, false, false, 'en']
    );
    console.log('[Auth] User settings initialized successfully');
  } catch (error) {
    console.error('[Auth] Error initializing user settings:', error);
  }
}

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  console.log('[Auth] Signup request received:', req.body);
  try {
    const { email, password, firstName = '', lastName = '' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email',
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Seed default categories and initialize settings for new user
    await seedDefaultCategories(user.id);
    await initializeUserSettings(user.id);

    const token = jwt.sign({ userId: user.id }, config.jwtSecret as string, {
      expiresIn: config.jwtExpiry,
    } as SignOptions);

    console.log('[Auth] Signup successful for:', email);
    res.status(201).json({ user: { id: user.id, email: user.email }, token });
  } catch (error: any) {
    console.error('[Auth] Signup error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Signup failed: ' + error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  console.log('[Auth] Login request received:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret as string, {
      expiresIn: config.jwtExpiry,
    } as SignOptions);

    console.log('[Auth] Login successful for:', email);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

console.log('[Auth Routes] Auth routes loaded successfully');
export default router;
