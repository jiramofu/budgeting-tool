import fs from 'fs';
import path from 'path';
import { pool } from './database';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[Database] Initializing database schema and migrations...');

    // Always read and execute schema (it uses CREATE TABLE IF NOT EXISTS)
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('[Database] Executing main schema...');
    const statements = schemaSql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            console.error('[Database] Error executing statement:', error);
            throw error;
          }
        }
      }
    }

    console.log('[Database] Main schema initialization completed');

    // Apply any additional migrations
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      if (migrationFiles.length > 0) {
        console.log(`[Database] Found ${migrationFiles.length} migration files, applying...`);

        for (const file of migrationFiles) {
          const migrationPath = path.join(migrationsDir, file);
          const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

          console.log(`[Database] Applying migration: ${file}`);
          const migrationStatements = migrationSql.split(';').filter(s => s.trim());

          for (const statement of migrationStatements) {
            if (statement.trim()) {
              try {
                await pool.query(statement);
              } catch (error: any) {
                if (!error.message.includes('already exists') && !error.message.includes('unique constraint')) {
                  console.warn(`[Database] Warning in ${file}:`, error.message);
                }
              }
            }
          }
        }
      }
    }

    console.log('[Database] Database initialization completed successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  }
}
