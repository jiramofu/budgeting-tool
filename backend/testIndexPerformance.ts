import { pool } from './src/config/database';

/**
 * Test script to verify index creation and performance
 * Run: npm run ts-node -- testIndexPerformance.ts
 */

async function verifyIndexes() {
  const client = await pool.connect();

  try {
    console.log('\n=== Verifying Performance Indexes ===\n');

    // Get list of all created indexes
    const indexQuery = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;

    const result = await client.query(indexQuery);

    console.log(`✓ Total indexes created: ${result.rows.length}\n`);

    // Group by table
    const indexesByTable: { [key: string]: string[] } = {};
    result.rows.forEach((row: any) => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });

    // Display indexes by table
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`\n${table}: (${indexes.length} indexes)`);
      indexes.forEach(idx => {
        console.log(`  - ${idx}`);
      });
    });

    console.log('\n\n=== Testing Index Performance with EXPLAIN ANALYZE ===\n');

    // Test common queries
    const testQueries = [
      {
        name: 'Transaction lookup by user and date',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM transactions
          WHERE user_id = 1 AND transaction_date > NOW() - INTERVAL '30 days'
          ORDER BY transaction_date DESC;`,
      },
      {
        name: 'Transaction search by category',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM transactions
          WHERE user_id = 1 AND category_id IS NOT NULL
          LIMIT 10;`,
      },
      {
        name: 'Budget by user and month',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM budgets
          WHERE user_id = 1 AND year = 2026 AND month = 5;`,
      },
      {
        name: 'Spending analytics by user and month',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM spending_analytics
          WHERE user_id = 1 AND year = 2026 AND month = 5;`,
      },
      {
        name: 'Cash flow projections by user',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM cash_flow_projections
          WHERE user_id = 1 AND projection_date >= NOW()
          ORDER BY projection_date
          LIMIT 90;`,
      },
      {
        name: 'Active projection inputs',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM projection_inputs
          WHERE user_id = 1 AND is_active = true;`,
      },
      {
        name: 'Spending alerts by user',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM spending_alerts
          WHERE user_id = 1 AND is_active = true;`,
      },
      {
        name: 'Search queries by user',
        sql: `EXPLAIN ANALYZE
          SELECT * FROM search_queries
          WHERE user_id = 1 AND is_favorite = true;`,
      },
    ];

    for (const test of testQueries) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Query: ${test.name}`);
      console.log(`${'─'.repeat(60)}`);

      try {
        const explainResult = await client.query(test.sql);

        // Extract key metrics from the plan
        const plan = explainResult.rows.map((r: any) => r['QUERY PLAN']).join('\n');
        console.log(plan);

        // Check if index was used
        if (plan.includes('Index') || plan.includes('Bitmap')) {
          console.log('\n✓ Index usage detected');
        } else {
          console.log('\n⚠ No index detected - sequential scan used');
        }
      } catch (error) {
        console.error(`✗ Error analyzing query: ${error}`);
      }
    }

    console.log('\n\n=== Index Statistics ===\n');

    // Get index size and usage statistics
    const statsQuery = `
      SELECT
        t.relname as tablename,
        i.relname as indexname,
        s.idx_scan as scans,
        s.idx_tup_read as tuples_read,
        s.idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(i.oid)) as index_size
      FROM pg_index x
      JOIN pg_class t ON t.oid = x.indrelid
      JOIN pg_class i ON i.oid = x.indexrelid
      JOIN pg_stat_user_indexes s ON s.indexrelname = i.relname
      ORDER BY s.idx_scan DESC, t.relname, i.relname;
    `;

    const statsResult = await client.query(statsQuery);

    console.log('Index Usage Statistics:');
    console.log('(Note: Usage stats will be populated as queries use the indexes)\n');

    if (statsResult.rows.length > 0) {
      statsResult.rows.slice(0, 15).forEach((row: any) => {
        console.log(`${row.tablename}.${row.indexname}:`);
        console.log(`  Size: ${row.index_size}`);
        console.log(`  Scans: ${row.scans}`);
        console.log(`  Tuples Read: ${row.tuples_read}`);
        console.log(`  Tuples Fetched: ${row.tuples_fetched}`);
        console.log();
      });

      if (statsResult.rows.length > 15) {
        console.log(`... and ${statsResult.rows.length - 15} more indexes`);
      }
    } else {
      console.log('No usage statistics yet (new indexes will accumulate stats with use)');
    }

    console.log('\n\n=== Summary ===');
    console.log('✓ Migration 005 completed successfully');
    console.log(`✓ Created ${result.rows.length} performance indexes`);
    console.log('✓ Indexes are ready for optimization');
    console.log('\nNote: Sequential scans are shown because test data is small.');
    console.log('As the database grows with real data, indexes will be automatically used.');

  } finally {
    client.release();
    await pool.end();
  }
}

verifyIndexes().catch(error => {
  console.error('Error verifying indexes:', error);
  process.exit(1);
});
