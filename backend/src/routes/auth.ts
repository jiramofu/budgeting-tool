import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { config } from '../config/env';
import { sendEmail } from '../services/emailService';

// Country to Currency mapping
const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD', 'NZ': 'NZD',
  'AT': 'EUR', 'BE': 'EUR', 'CY': 'EUR', 'EE': 'EUR', 'FI': 'EUR', 'FR': 'EUR', 'DE': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'IT': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'NL': 'EUR', 'PT': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'ES': 'EUR',
  'DK': 'DKK', 'CZ': 'CZK', 'HU': 'HUF', 'PL': 'PLN', 'RO': 'RON', 'SE': 'SEK', 'NO': 'NOK', 'CH': 'CHF',
  'CN': 'CNY', 'HK': 'HKD', 'IN': 'INR', 'ID': 'IDR', 'JP': 'JPY', 'MY': 'MYR', 'PH': 'PHP', 'SG': 'SGD', 'KR': 'KRW', 'TW': 'TWD', 'TH': 'THB', 'VN': 'VND',
  'SA': 'SAR', 'AE': 'AED', 'IL': 'ILS',
  'ZA': 'ZAR', 'EG': 'EGP', 'NG': 'NGN',
  'BR': 'BRL', 'CL': 'CLP', 'CO': 'COP', 'MX': 'MXN', 'AR': 'ARS',
};

// Locale to Country mapping (for OAuth locale strings like "en-US")
const LOCALE_COUNTRY_MAP: { [key: string]: string } = {
  'en-US': 'US', 'en-GB': 'GB', 'en-AU': 'AU', 'en-NZ': 'NZ', 'en-CA': 'CA',
  'de-DE': 'DE', 'de-AT': 'AT', 'de-CH': 'CH',
  'fr-FR': 'FR', 'fr-BE': 'BE', 'fr-CH': 'CH',
  'es-ES': 'ES', 'es-MX': 'MX', 'es-AR': 'AR', 'es-CL': 'CL',
  'it-IT': 'IT',
  'pt-BR': 'BR', 'pt-PT': 'PT',
  'nl-NL': 'NL', 'nl-BE': 'BE',
  'pl-PL': 'PL',
  'ru-RU': 'RU', 'ja-JP': 'JP', 'zh-CN': 'CN', 'zh-TW': 'TW',
  'ko-KR': 'KR',
  'th-TH': 'TH',
  'hi-IN': 'IN',
  'ar-SA': 'SA', 'ar-AE': 'AE',
  'af-ZA': 'ZA',
  'sv-SE': 'SE', 'da-DK': 'DK', 'nb-NO': 'NO',
};

const getCurrencyForCountry = (countryCode: string): string => {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
};

const getCountryFromLocale = (locale: string): string => {
  if (!locale) return 'US';

  // First try exact match
  if (LOCALE_COUNTRY_MAP[locale]) {
    return LOCALE_COUNTRY_MAP[locale];
  }

  // Try language-only match (e.g., "en" -> try "en-*")
  const languageCode = locale.split('-')[0].toLowerCase();
  const matching = Object.entries(LOCALE_COUNTRY_MAP).find(
    ([key]) => key.startsWith(languageCode + '-')
  );

  if (matching) {
    return matching[1];
  }

  return 'US'; // Default fallback
};

const router = Router();

console.log('[Auth Routes] Loading auth routes...');

// Helper: Generate verification token and hash
function generateVerificationToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return { token, hash };
}

// Helper: Send verification email
async function sendVerificationEmail(
  email: string,
  token: string,
  frontendUrl: string = 'http://localhost:5173'
): Promise<boolean> {
  const verificationLink = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
    <h2>Welcome to Budget Tool!</h2>
    <p>Please verify your email address to complete your signup:</p>
    <p><a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Verify Email</a></p>
    <p>Or copy this link: <code>${verificationLink}</code></p>
    <p>This link expires in 24 hours.</p>
  `;

  const result = await sendEmail({
    to: email,
    subject: 'Verify your Budget Tool email',
    html,
  });

  return result.success;
}

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

async function initializeUserSettingsWithCurrency(userId: number, currency: string): Promise<void> {
  try {
    console.log('[Auth] Initializing user settings for user:', userId, 'with currency:', currency);
    const result = await query(
      `INSERT INTO user_settings (user_id, theme, currency, date_format, default_budgeting_method,
                                 email_notifications, push_notifications, two_factor_enabled, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, 'light', currency, 'MM/DD/YYYY', 'flex', true, false, false, 'en']
    );
    console.log('[Auth] User settings initialized successfully:', result.rows[0]);
  } catch (error: any) {
    console.error('[Auth] CRITICAL ERROR initializing user settings:', {
      userId,
      currency,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetail: error.detail,
      stack: error.stack
    });
    throw error; // Re-throw so signup fails if settings can't be created
  }
}

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  console.log('[Auth] Signup request received:', req.body);
  try {
    const { email, password, firstName = '', lastName = '', country = 'US' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email',
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Create default "Personal" organization for new user
    console.log('[Auth] Creating default organization for user:', user.id);
    const orgResult = await query(
      `INSERT INTO organizations (name, description, owner_id, organization_type, created_at, updated_at)
       VALUES ($1, $2, $3, 'personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        `${firstName || email.split('@')[0]}'s Budget`,
        'Personal budgeting',
        user.id,
      ]
    );
    const organizationId = orgResult.rows[0].id;

    // Add user as owner of their personal organization
    console.log('[Auth] Adding user as owner of organization:', organizationId);
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role, invitation_accepted_at, is_active, created_at, updated_at)
       VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [organizationId, user.id]
    );

    // Seed default categories and initialize settings for new user
    await seedDefaultCategories(user.id);

    // Get currency based on country
    const currency = getCurrencyForCountry(country);

    // Initialize user settings with correct currency
    await initializeUserSettingsWithCurrency(user.id, currency);

    const token = jwt.sign({ userId: user.id }, config.jwtSecret as string, {
      expiresIn: config.jwtExpiry,
    } as SignOptions);

    // Send verification email in background (non-blocking)
    const { token: verificationToken } = generateVerificationToken();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    sendVerificationEmail(email, verificationToken, frontendUrl).catch(err => {
      console.error('[Auth] Failed to send verification email:', err);
      // Don't fail signup even if email fails
    });

    console.log('[Auth] Signup successful for:', email);
    res.status(201).json({
      user: { id: user.id, email: user.email },
      token,
      message: 'Signup successful. Check your email for verification link.'
    });
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

// Google OAuth
router.post('/google', async (req: Request, res: Response) => {
  console.log('[Auth] Google OAuth request received');
  try {
    const { idToken, locale } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // In production, verify the token with Google's API
    // For now, we'll use a simplified version
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, locale: payloadLocale } = payload;

    // Determine country from locale (either passed from frontend or from payload)
    const userLocale = locale || payloadLocale || 'en-US';
    const country = getCountryFromLocale(userLocale);
    const currency = getCurrencyForCountry(country);

    console.log('[Auth] Google OAuth user locale:', userLocale, '-> country:', country, '-> currency:', currency);

    // Check if user exists, if not create them
    let userResult = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    let user;
    if (userResult.rows.length === 0) {
      // Create new user from Google data
      const createResult = await query(
        'INSERT INTO users (email, first_name, last_name, provider) VALUES ($1, $2, $3, $4) RETURNING id, email',
        [email, given_name, family_name, 'google']
      );
      user = createResult.rows[0];

      // Seed default categories and initialize settings with correct currency
      await seedDefaultCategories(user.id);
      await initializeUserSettingsWithCurrency(user.id, currency);
    } else {
      user = userResult.rows[0];
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret as string, {
      expiresIn: config.jwtExpiry,
    } as SignOptions);

    console.log('[Auth] Google OAuth successful for:', email);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error: any) {
    console.error('[Auth] Google OAuth error:', error);
    res.status(401).json({ error: 'Google authentication failed: ' + error.message });
  }
});

// Apple OAuth
router.post('/apple', async (req: Request, res: Response) => {
  console.log('[Auth] Apple OAuth request received');
  try {
    const { identityToken, user, locale } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'Identity token is required' });
    }

    // In production, verify the token with Apple's API
    // For now, we'll use a simplified version
    const jwtlib = require('jsonwebtoken');
    const decoded = jwtlib.decode(identityToken);

    const { email } = decoded;
    const firstName = user?.name?.firstName || '';
    const lastName = user?.name?.lastName || '';

    // Determine country from locale passed from frontend (Apple doesn't provide location in token)
    // Default to US if not provided
    const userLocale = locale || 'en-US';
    const country = getCountryFromLocale(userLocale);
    const currency = getCurrencyForCountry(country);

    console.log('[Auth] Apple OAuth user locale:', userLocale, '-> country:', country, '-> currency:', currency);

    // Check if user exists, if not create them
    let userResult = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    let appUser;
    if (userResult.rows.length === 0) {
      // Create new user from Apple data
      const createResult = await query(
        'INSERT INTO users (email, first_name, last_name, provider) VALUES ($1, $2, $3, $4) RETURNING id, email',
        [email, firstName, lastName, 'apple']
      );
      appUser = createResult.rows[0];

      // Seed default categories and initialize settings with correct currency
      await seedDefaultCategories(appUser.id);
      await initializeUserSettingsWithCurrency(appUser.id, currency);
    } else {
      appUser = userResult.rows[0];
    }

    const token = jwtlib.sign({ userId: appUser.id }, config.jwtSecret as string, {
      expiresIn: config.jwtExpiry,
    } as SignOptions);

    console.log('[Auth] Apple OAuth successful for:', email);
    res.json({ user: { id: appUser.id, email: appUser.email }, token });
  } catch (error: any) {
    console.error('[Auth] Apple OAuth error:', error);
    res.status(401).json({ error: 'Apple authentication failed: ' + error.message });
  }
});

console.log('[Auth Routes] Auth routes loaded successfully');
export default router;
