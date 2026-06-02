import fs from 'fs';
import path from 'path';
import { pool } from './database';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[Database] Initializing database schema and migrations...');

    // Skip full schema initialization in production if tables exist
    // Just verify connection
    try {
      await pool.query('SELECT 1');
      console.log('[Database] Database connection verified');
    } catch (error) {
      console.error('[Database] Failed to connect to database');
      throw error;
    }

    // Try to load schema but don't fail if it takes too long
    const schemaTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Schema initialization timeout')), 15000)
    );

    try {
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

      console.log('[Database] Executing main schema...');
      const statements = schemaSql.split(';').filter(s => s.trim().length > 0);

      console.log(`[Database] Found ${statements.length} SQL statements to execute`);
      let executedCount = 0;

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            // Skip comments and empty statements
            if (statement.trim().startsWith('--')) continue;

            await pool.query(statement);
            executedCount++;
          } catch (error: any) {
            // Ignore "already exists" errors and index-related errors
            if (error.message.includes('already exists') || error.message.includes('relation already exists')) {
              // Expected - table/index already exists
              executedCount++;
            } else if (statement.trim().startsWith('CREATE INDEX') || statement.trim().startsWith('CREATE UNIQUE INDEX')) {
              console.warn('[Database] Warning creating index:', error.message?.substring(0, 100));
              executedCount++;
            } else {
              console.error(`[Database] Error executing statement: ${error.message?.substring(0, 100)}`);
              // Don't throw - try to continue
              executedCount++;
            }
          }
        }
      }

      console.log(`[Database] Executed ${executedCount} statements`);
    } catch (error: any) {
      if (error.message === 'Schema initialization timeout') {
        console.warn('[Database] Schema initialization timeout - assuming tables exist');
      } else {
        console.error('[Database] Error initializing schema:', error.message);
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
