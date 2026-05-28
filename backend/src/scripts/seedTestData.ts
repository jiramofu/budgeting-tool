import { pool } from '../config/database';
import bcrypt from 'bcrypt';

const TEST_USER_EMAIL = 'demo@example.com';
const TEST_USER_PASSWORD = 'DemoPassword123!';

async function seedTestData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting database seed...\n');

    // 1. Create test user
    console.log('📝 Creating test user...');
    const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      [TEST_USER_EMAIL, passwordHash]
    );

    const userId = userResult.rows[0].id;
    console.log(`✅ Test user created: ${TEST_USER_EMAIL} (ID: ${userId})\n`);

    // 2. Create budget for May 2026
    console.log('💰 Creating test budget...');
    const budgetResult = await client.query(
      `INSERT INTO budgets (user_id, month, year, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [userId, 5, 2026]
    );

    const budgetId = budgetResult.rows[0].id;
    console.log(`✅ Budget created: May 2026 with $5,000 limit (ID: ${budgetId})\n`);

    // 3. Create categories
    console.log('🏷️  Creating categories...');
    const categories = await client.query(
      `INSERT INTO categories (user_id, name, type, created_at, updated_at)
       VALUES
       ($1, 'Income', 'variable', NOW(), NOW()),
       ($1, 'Groceries', 'variable', NOW(), NOW()),
       ($1, 'Dining Out', 'variable', NOW(), NOW()),
       ($1, 'Transportation', 'variable', NOW(), NOW()),
       ($1, 'Entertainment', 'variable', NOW(), NOW()),
       ($1, 'Utilities', 'fixed', NOW(), NOW()),
       ($1, 'Rent/Mortgage', 'fixed', NOW(), NOW()),
       ($1, 'Health & Wellness', 'variable', NOW(), NOW()),
       ($1, 'Shopping', 'variable', NOW(), NOW())
       RETURNING id, name`,
      [userId]
    );

    const categoryMap: { [key: string]: number } = {};
    categories.rows.forEach((cat: any) => {
      categoryMap[cat.name] = cat.id;
    });
    console.log(`✅ Created ${categories.rows.length} categories\n`);

    // 4. Create budget targets
    console.log('🎯 Creating budget targets...');
    const targetQueries = [
      { category: 'Groceries', amount: 600 },
      { category: 'Dining Out', amount: 300 },
      { category: 'Transportation', amount: 400 },
      { category: 'Entertainment', amount: 200 },
      { category: 'Utilities', amount: 150 },
      { category: 'Rent/Mortgage', amount: 2000 },
      { category: 'Health & Wellness', amount: 200 },
      { category: 'Shopping', amount: 250 },
    ];

    for (const target of targetQueries) {
      await client.query(
        `INSERT INTO budget_targets (budget_id, category_id, target_amount, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [budgetId, categoryMap[target.category], target.amount]
      );
    }
    console.log(`✅ Created ${targetQueries.length} budget targets\n`);

    // 5. Create sample transactions (last 30 days)
    console.log('💳 Creating sample transactions...');
    const transactions = [
      // Week 1
      { date: '2026-05-01', amount: -125.50, description: 'Whole Foods', category: 'Groceries' },
      { date: '2026-05-01', amount: -45.00, description: 'Coffee Shop', category: 'Dining Out' },
      { date: '2026-05-02', amount: -2000.00, description: 'Monthly Rent', category: 'Rent/Mortgage' },
      { date: '2026-05-02', amount: -85.00, description: 'Gas Station', category: 'Transportation' },
      { date: '2026-05-03', amount: -230.00, description: 'Whole Foods', category: 'Groceries' },
      { date: '2026-05-03', amount: -65.00, description: 'Movie Tickets', category: 'Entertainment' },
      { date: '2026-05-04', amount: -150.00, description: 'Electricity Bill', category: 'Utilities' },
      { date: '2026-05-04', amount: -89.99, description: 'Gym Membership', category: 'Health & Wellness' },

      // Week 2
      { date: '2026-05-07', amount: -156.00, description: 'Trader Joes', category: 'Groceries' },
      { date: '2026-05-07', amount: -52.00, description: 'Restaurant Dinner', category: 'Dining Out' },
      { date: '2026-05-08', amount: -120.00, description: 'Uber/Lyft', category: 'Transportation' },
      { date: '2026-05-09', amount: -199.99, description: 'Nike Shoes', category: 'Shopping' },
      { date: '2026-05-10', amount: -45.00, description: 'Yoga Class', category: 'Health & Wellness' },
      { date: '2026-05-11', amount: -78.00, description: 'Concert Tickets', category: 'Entertainment' },

      // Week 3
      { date: '2026-05-14', amount: -142.50, description: 'Grocery Store', category: 'Groceries' },
      { date: '2026-05-15', amount: -95.00, description: 'Brunch with Friends', category: 'Dining Out' },
      { date: '2026-05-16', amount: -65.00, description: 'Gas', category: 'Transportation' },
      { date: '2026-05-17', amount: -300.00, description: 'Clothes Shopping', category: 'Shopping' },
      { date: '2026-05-18', amount: -55.00, description: 'Therapy Session', category: 'Health & Wellness' },

      // Week 4
      { date: '2026-05-21', amount: -118.00, description: 'Whole Foods', category: 'Groceries' },
      { date: '2026-05-22', amount: -75.00, description: 'Lunch Meeting', category: 'Dining Out' },
      { date: '2026-05-23', amount: -90.00, description: 'Uber to Airport', category: 'Transportation' },
      { date: '2026-05-24', amount: -45.00, description: 'Movie Night', category: 'Entertainment' },
      { date: '2026-05-25', amount: -120.00, description: 'Whole Foods', category: 'Groceries' },

      // Income
      { date: '2026-05-01', amount: 3500.00, description: 'Salary Deposit', category: null },
    ];

    for (const txn of transactions) {
      const categoryId = txn.category ? categoryMap[txn.category] : categoryMap['Income'];
      await client.query(
        `INSERT INTO transactions (user_id, amount, description, transaction_date, category_id, transaction_type, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'manual', NOW(), NOW())`,
        [
          userId,
          txn.amount,
          txn.description,
          txn.date,
          categoryId,
          txn.amount > 0 ? 'income' : 'expense',
        ]
      );
    }
    console.log(`✅ Created ${transactions.length} sample transactions\n`);

    await client.query('COMMIT');

    console.log('✨ Database seeding complete!\n');
    console.log('📋 Test Account Credentials:');
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}\n`);
    console.log('🚀 Login with these credentials at http://localhost:3000/login');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed script
seedTestData()
  .then(() => {
    console.log('\n✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
