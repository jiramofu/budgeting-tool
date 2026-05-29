/**
 * Phase 8D Data Integrity Fix: Backfill NULL organization_id values
 *
 * This script fixes the 308 existing records (2 budgets, 25 transactions, 281 categories)
 * that lack organization_id after the schema migration.
 *
 * These records are assigned to organization_id = 1 (the default/primary organization)
 */

import { pool } from '../config/database';

async function backfillOrganizationIds() {
  console.log('🔄 Phase 8D: Starting data backfill migration...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current state of records with NULL organization_id...');

    const nullCheckQuery = `
      SELECT table_name, null_count
      FROM (
        SELECT 'budgets' as table_name, COUNT(*) as null_count FROM budgets WHERE organization_id IS NULL
        UNION ALL
        SELECT 'transactions', COUNT(*) FROM transactions WHERE organization_id IS NULL
        UNION ALL
        SELECT 'categories', COUNT(*) FROM categories WHERE organization_id IS NULL
      ) t
      WHERE null_count > 0
      ORDER BY table_name;
    `;

    const checkResult = await pool.query(nullCheckQuery);

    if (checkResult.rows.length === 0) {
      console.log('✅ All records already have organization_id values. No backfill needed.\n');
      return;
    }

    console.log('Found records with NULL organization_id:');
    checkResult.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}: ${row.null_count} records`);
    });
    console.log();

    // Step 2: Execute backfill
    console.log('📝 Step 2: Executing backfill migration...');

    const budgetsUpdate = await pool.query(
      'UPDATE budgets SET organization_id = 1 WHERE organization_id IS NULL'
    );
    console.log(`  ✓ Updated budgets: ${budgetsUpdate.rowCount} rows`);

    const transactionsUpdate = await pool.query(
      'UPDATE transactions SET organization_id = 1 WHERE organization_id IS NULL'
    );
    console.log(`  ✓ Updated transactions: ${transactionsUpdate.rowCount} rows`);

    const categoriesUpdate = await pool.query(
      'UPDATE categories SET organization_id = 1 WHERE organization_id IS NULL'
    );
    console.log(`  ✓ Updated categories: ${categoriesUpdate.rowCount} rows`);
    console.log();

    // Step 3: Verify backfill
    console.log('✔️  Step 3: Verifying backfill completion...');

    const verifyQuery = `
      SELECT table_name, null_count
      FROM (
        SELECT 'budgets' as table_name, COUNT(*) as null_count FROM budgets WHERE organization_id IS NULL
        UNION ALL
        SELECT 'transactions', COUNT(*) as null_count FROM transactions WHERE organization_id IS NULL
        UNION ALL
        SELECT 'categories', COUNT(*) as null_count FROM categories WHERE organization_id IS NULL
      ) t
      WHERE null_count > 0;
    `;

    const verifyResult = await pool.query(verifyQuery);

    if (verifyResult.rows.length === 0) {
      console.log('✅ BACKFILL SUCCESSFUL: All records now have organization_id values!\n');

      // Show summary statistics
      const totalUpdated = (budgetsUpdate.rowCount || 0) +
                          (transactionsUpdate.rowCount || 0) +
                          (categoriesUpdate.rowCount || 0);

      console.log('📊 Backfill Summary:');
      console.log(`  Total records updated: ${totalUpdated}`);
      console.log(`  All records now assigned to organization_id = 1\n`);

      console.log('🚀 Phase 8D data integrity fix complete!');
      console.log('✨ Ready to re-run tests to verify security tests pass.\n');
    } else {
      console.log('⚠️  WARNING: Some records still have NULL organization_id:');
      verifyResult.rows.forEach((row: any) => {
        console.log(`  - ${row.table_name}: ${row.null_count} records`);
      });
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during backfill migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the backfill
backfillOrganizationIds();
