const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'budgeting_tool',
  user: 'postgres',
  password: 'postgres'
});

async function testDB() {
  try {
    // Check if user 75 exists
    const userResult = await pool.query('SELECT id, email FROM users WHERE id = 75');
    console.log('User 75 exists:', userResult.rows.length > 0);
    if (userResult.rows.length > 0) {
      console.log('User:', userResult.rows[0]);
    }

    // Check if user 75 has settings
    const settingsResult = await pool.query('SELECT * FROM user_settings WHERE user_id = 75');
    console.log('User 75 settings exist:', settingsResult.rows.length > 0);
    if (settingsResult.rows.length > 0) {
      console.log('Settings:', settingsResult.rows[0]);
    } else {
      console.log('No settings found - initializing...');
      
      // Insert default settings
      await pool.query(
        `INSERT INTO user_settings (user_id, theme, currency, date_format, default_budgeting_method, email_notifications, push_notifications, two_factor_enabled, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [75, 'light', 'USD', 'MM/DD/YYYY', 'flex', true, false, false, 'en']
      );
      console.log('Settings initialized!');
    }

    // Test UPDATE
    console.log('\nTesting UPDATE...');
    const updateResult = await pool.query(
      'UPDATE user_settings SET currency = $1 WHERE user_id = $2 RETURNING *',
      ['EUR', 75]
    );
    console.log('Update successful, rows affected:', updateResult.rowCount);
    console.log('Updated settings:', updateResult.rows[0]);

    // Verify with SELECT
    const verifyResult = await pool.query('SELECT currency FROM user_settings WHERE user_id = 75');
    console.log('Verified currency:', verifyResult.rows[0].currency);

  } catch (err) {
    console.error('Database error:', err.message);
    console.error('Code:', err.code);
  } finally {
    await pool.end();
  }
}

testDB();
