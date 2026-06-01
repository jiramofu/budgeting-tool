const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ZAnVAzmohzQzyydpYMvKzJTsPachvMzI@postgres.railway.internal:5432/railway'
});

async function wipeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🗑️  Starting database wipe...');

    await client.query('BEGIN');

    // Delete all user data in correct order (respecting foreign keys)
    const deleteQueries = [
      'DELETE FROM organization_members',
      'DELETE FROM organization_roles',
      'DELETE FROM audit_logs',
      'DELETE FROM api_usage_logs',
      'DELETE FROM api_rate_limits',
      'DELETE FROM bank_connections',
      'DELETE FROM budget_targets',
      'DELETE FROM transactions',
      'DELETE FROM bills',
      'DELETE FROM goal_progress',
      'DELETE FROM goals',
      'DELETE FROM categories',
      'DELETE FROM budgets',
      'DELETE FROM user_settings',
      'DELETE FROM notifications',
      'DELETE FROM alert_preferences',
      'DELETE FROM search_history',
      'DELETE FROM organizations',
      'DELETE FROM users'
    ];

    for (const query of deleteQueries) {
      console.log(`  Executing: ${query}`);
      const result = await client.query(query);
      console.log(`    ✓ Deleted ${result.rowCount || 0} rows`);
    }

    // Verify deletion
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const budgetCount = await client.query('SELECT COUNT(*) FROM budgets');
    const txnCount = await client.query('SELECT COUNT(*) FROM transactions');
    const orgCount = await client.query('SELECT COUNT(*) FROM organizations');

    console.log('\n📊 Verification:');
    console.log(`  Users: ${userCount.rows[0].count}`);
    console.log(`  Budgets: ${budgetCount.rows[0].count}`);
    console.log(`  Transactions: ${txnCount.rows[0].count}`);
    console.log(`  Organizations: ${orgCount.rows[0].count}`);

    await client.query('COMMIT');
    console.log('\n✅ Database wiped successfully! Ready for fresh beta testing.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during wipe:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

wipeDatabase();
