import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './src/config/database';

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  try {
    // Read migration files
    const migration003Path = join(__dirname, '../database/migrations/003_add_search_and_templates.sql');
    const seedPath = join(__dirname, '../database/seeds/001_budget_templates.sql');

    console.log('📄 Reading migration file:', migration003Path);
    const migration003 = readFileSync(migration003Path, 'utf-8');

    console.log('📄 Reading seed file:', seedPath);
    const seedData = readFileSync(seedPath, 'utf-8');

    // Split by semicolon and filter empty statements
    const migration003Statements = migration003
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    const seedStatements = seedData
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute migration statements
    console.log('\n🏗️  Applying migrations (003)...');
    for (const statement of migration003Statements) {
      try {
        await pool.query(statement);
        const preview = statement.substring(0, 50).replace(/\n/g, ' ');
        console.log(`  ✓ Executed: ${preview}...`);
      } catch (error: any) {
        // Some statements like CREATE INDEX IF NOT EXISTS may fail if already exists
        if (error.message.includes('already exists')) {
          const preview = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`  ✓ Already exists: ${preview}...`);
        } else {
          console.error(`  ✗ Failed: ${error.message.substring(0, 80)}`);
          throw error;
        }
      }
    }

    // Execute seed statements
    console.log('\n🌱 Seeding template data (001)...');
    for (const statement of seedStatements) {
      try {
        await pool.query(statement);
        const preview = statement.substring(0, 50).replace(/\n/g, ' ');
        console.log(`  ✓ Executed: ${preview}...`);
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          const preview = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`  ✓ Already exists: ${preview}...`);
        } else {
          console.error(`  ✗ Failed: ${error.message.substring(0, 80)}`);
          // Don't throw - seed data is not critical
        }
      }
    }

    // Verify tables were created
    console.log('\n✅ Verifying migration success...');

    const tables = ['search_queries', 'search_analytics', 'budget_templates', 'template_applications'];
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      if (result.rows[0].exists) {
        console.log(`  ✓ Table created: ${table}`);
      } else {
        console.warn(`  ⚠ Table not found: ${table}`);
      }
    }

    // Check if templates were seeded
    const templateCount = await pool.query('SELECT COUNT(*) as count FROM budget_templates');
    const count = parseInt(templateCount.rows[0].count);
    console.log(`  ✓ Templates seeded: ${count} templates`);

    console.log('\n🎉 Migrations completed successfully!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigrations();
