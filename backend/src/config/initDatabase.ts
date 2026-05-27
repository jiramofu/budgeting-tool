import fs from 'fs';
import path from 'path';
import { pool } from './database';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[Database] Checking if database is initialized...');

    // Check if users table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (result.rows[0].exists) {
      console.log('[Database] Database already initialized, skipping schema creation');
      return;
    }

    console.log('[Database] Database not initialized, running schema...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
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

    console.log('[Database] Schema initialization completed successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  }
}
