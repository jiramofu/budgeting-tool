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
      };
    } catch (error) {
      console.error('[Settings] Error getting user settings:', error);
      return this.getDefaultSettings(userId);
    }
  }

  static async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      await query(
        `INSERT INTO user_settings (user_id, theme, currency, date_format, default_budgeting_method,
                                   email_notifications, push_notifications, two_factor_enabled, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
           theme = COALESCE($2, user_settings.theme),
           currency = COALESCE($3, user_settings.currency),
           date_format = COALESCE($4, user_settings.date_format),
           default_budgeting_method = COALESCE($5, user_settings.default_budgeting_method),
           email_notifications = COALESCE($6, user_settings.email_notifications),
           push_notifications = COALESCE($7, user_settings.push_notifications),
           two_factor_enabled = COALESCE($8, user_settings.two_factor_enabled),
           language = COALESCE($9, user_settings.language)`,
        [
          userId,
          settings.theme,
          settings.currency,
          settings.dateFormat,
          settings.defaultBudgetingMethod,
          settings.emailNotifications,
          settings.pushNotifications,
          settings.twoFactorEnabled,
          settings.language,
        ]
      );

      return this.getUserSettings(userId);
    } catch (error) {
      console.error('[Settings] Error updating user settings:', error);
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
