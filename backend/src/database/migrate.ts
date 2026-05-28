import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

interface Migration {
  name: string;
  path: string;
}

async function getMigrationTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
}

async function getExecutedMigrations(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT name FROM migrations ORDER BY executed_at');
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting executed migrations:', error);
    return [];
  }
}

async function getMigrationFiles(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, '../../database/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(file => ({
    name: file.replace('.sql', ''),
    path: path.join(migrationsDir, file)
  }));
}

async function runMigration(migration: Migration): Promise<void> {
  try {
    console.log(`\n[Migration] Running: ${migration.name}`);
    const sql = fs.readFileSync(migration.path, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          // Ignore "already exists" errors for idempotency
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.error(`[Migration] Error in ${migration.name}:`, error.message);
            throw error;
          }
        }
      }
    }

    // Record migration as executed
    await pool.query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [migration.name]
    );

    console.log(`[Migration] ✓ ${migration.name} completed successfully`);
  } catch (error) {
    console.error(`[Migration] ✗ Failed: ${migration.name}`, error);
    throw error;
  }
}

async function migrate(): Promise<void> {
  try {
    console.log('[Migration] Starting database migrations...');

    // Create migrations table if it doesn't exist
    await getMigrationTable();

    // Get list of executed migrations
    const executed = await getExecutedMigrations();
    console.log(`[Migration] Already executed: ${executed.length} migrations`);

    // Get all migration files
    const allMigrations = await getMigrationFiles();
    console.log(`[Migration] Found ${allMigrations.length} total migrations`);

    // Filter for pending migrations
    const pending = allMigrations.filter(m => !executed.includes(m.name));

    if (pending.length === 0) {
      console.log('[Migration] No pending migrations');
      return;
    }

    console.log(`[Migration] ${pending.length} pending migrations to run`);

    // Run pending migrations
    for (const migration of pending) {
      await runMigration(migration);
    }

    console.log('\n[Migration] ✓ All migrations completed successfully!');
  } catch (error) {
    console.error('[Migration] ✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
migrate().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
