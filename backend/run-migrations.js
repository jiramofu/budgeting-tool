const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'budgeting_tool',
});

async function runMigrations() {
  try {
    const migrationsDir = './database/migrations';
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    }
    
    console.log('All migrations completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
