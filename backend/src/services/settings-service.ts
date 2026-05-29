import { query } from '../config/database';

interface UserSettings {
  userId: number;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  defaultBudgetingMethod: 'zero-based' | 'flex' | 'hybrid';
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  language: string;
  profilePicture?: string | null;
}

export class SettingsService {
  static async getUserSettings(userId: number): Promise<UserSettings> {
    try {
      const result = await query(
        `SELECT user_id, theme, currency, date_format, default_budgeting_method,
                email_notifications, push_notifications, two_factor_enabled, language
         FROM user_settings
         WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return this.getDefaultSettings(userId);
      }

      const row = result.rows[0];
      return {
        userId: row.user_id,
        theme: row.theme || 'light',
        currency: row.currency || 'USD',
        dateFormat: row.date_format || 'MM/DD/YYYY',
        defaultBudgetingMethod: row.default_budgeting_method || 'flex',
        emailNotifications: row.email_notifications !== false,
        pushNotifications: row.push_notifications === true,
        twoFactorEnabled: row.two_factor_enabled === true,
        language: row.language || 'en',
        profilePicture: null,
      };
    } catch (error) {
      console.error('[Settings] Error getting user settings:', error);
      return this.getDefaultSettings(userId);
    }
  }

  static async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      console.log('[Settings] ===== UPDATING SETTINGS WITH INSERT...ON CONFLICT =====');
      console.log('[Settings] User ID:', userId);
      console.log('[Settings] Settings to update:', JSON.stringify(settings));

      // Build dynamic INSERT...ON CONFLICT statement for ALL updates
      // This ensures the row is created/updated regardless of prior state
      const setClause: string[] = [];
      const params: any[] = [userId];
      let paramIndex = 2;

      // Build the UPDATE SET clause
      if (settings.theme !== undefined) {
        setClause.push(`theme = $${paramIndex}`);
        params.push(settings.theme);
        paramIndex++;
      }
      if (settings.currency !== undefined) {
        console.log('[Settings] Adding currency update:', settings.currency);
        setClause.push(`currency = $${paramIndex}`);
        params.push(settings.currency);
        paramIndex++;
      }
      if (settings.dateFormat !== undefined) {
        setClause.push(`date_format = $${paramIndex}`);
        params.push(settings.dateFormat);
        paramIndex++;
      }
      if (settings.defaultBudgetingMethod !== undefined) {
        setClause.push(`default_budgeting_method = $${paramIndex}`);
        params.push(settings.defaultBudgetingMethod);
        paramIndex++;
      }
      if (settings.emailNotifications !== undefined) {
        setClause.push(`email_notifications = $${paramIndex}`);
        params.push(settings.emailNotifications);
        paramIndex++;
      }
      if (settings.pushNotifications !== undefined) {
        setClause.push(`push_notifications = $${paramIndex}`);
        params.push(settings.pushNotifications);
        paramIndex++;
      }
      if (settings.twoFactorEnabled !== undefined) {
        setClause.push(`two_factor_enabled = $${paramIndex}`);
        params.push(settings.twoFactorEnabled);
        paramIndex++;
      }
      if (settings.language !== undefined) {
        setClause.push(`language = $${paramIndex}`);
        params.push(settings.language);
        paramIndex++;
      }

      // Always update timestamp
      setClause.push('updated_at = CURRENT_TIMESTAMP');

      const sql = `
        INSERT INTO user_settings (user_id, theme, currency, date_format, default_budgeting_method, email_notifications, push_notifications, two_factor_enabled, language)
        VALUES ($1, 'light', 'USD', 'MM/DD/YYYY', 'flex', true, false, false, 'en')
        ON CONFLICT (user_id) DO UPDATE SET
          ${setClause.join(', ')}
        RETURNING *
      `;

      console.log('[Settings] SQL to execute:', sql);
      console.log('[Settings] SQL params:', JSON.stringify(params));

      const result = await query(sql, params);

      console.log('[Settings] ===== INSERT...ON CONFLICT RESULT =====');
      console.log('[Settings] Rows returned:', result.rows.length);
      if (result.rows.length > 0) {
        console.log('[Settings] Updated row currency:', result.rows[0].currency);
        console.log('[Settings] Full updated row:', result.rows[0]);
      }

      // Verify the update persisted
      const verifyResult = await query(
        'SELECT id, user_id, currency FROM user_settings WHERE user_id = $1',
        [userId]
      );
      console.log('[Settings] ===== VERIFY PERSISTENCE =====');
      console.log('[Settings] Verified currency after update:', verifyResult.rows[0]?.currency);

      return this.getUserSettings(userId);
    } catch (error: any) {
      console.error('[Settings] ===== ERROR =====');
      console.error('[Settings] Error updating user settings:', error);
      console.error('[Settings] Error details:', {
        userId,
        settings,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  private static getDefaultSettings(userId: number): UserSettings {
    return {
      userId,
      theme: 'light',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      defaultBudgetingMethod: 'flex',
      emailNotifications: true,
      pushNotifications: false,
      twoFactorEnabled: false,
      language: 'en',
    };
  }
}
