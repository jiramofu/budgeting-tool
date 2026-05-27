import { pool } from './src/config/database';
import axios from 'axios';

const API_URL = 'http://localhost:5002/api';
let authToken = '';
let userId = 0;
let budgetId = 0;
let categoryId = 0;

const client = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

async function test() {
  let dbClient: any = null;

  try {
    console.log('='.repeat(80));
    console.log('PHASE 2: ALERT THRESHOLD VERIFICATION (WITH BUDGET TARGETS)');
    console.log('='.repeat(80));

    // Setup: Create user and budget
    console.log('\n[SETUP] Creating test user and budget...');
    const signupRes = await client.post('/auth/signup', {
      email: `threshold-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Threshold Tester',
    });

    if (signupRes.status !== 201) {
      console.error('✗ Signup failed:', signupRes.data);
      return;
    }

    authToken = signupRes.data.token;
    userId = signupRes.data.userId;
    client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✓ User created (ID: ' + userId + ')');

    // Get a category
    const categoriesRes = await client.get('/categories');
    if (!Array.isArray(categoriesRes.data) || categoriesRes.data.length === 0) {
      console.error('✗ No categories found');
      return;
    }
    categoryId = categoriesRes.data[0].id;
    console.log(`✓ Category selected (ID: ${categoryId})`);

    // Create budget
    const currentDate = new Date();
    const budgetRes = await client.post('/budgets', {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });

    if (budgetRes.status !== 201) {
      console.error('✗ Budget creation failed:', budgetRes.data);
      return;
    }

    budgetId = budgetRes.data.id;
    const BUDGET_LIMIT = 1000;
    console.log(`✓ Budget created (ID: ${budgetId}, Limit: $${BUDGET_LIMIT})`);

    // Create budget target in database
    console.log('\n[DATABASE] Creating budget target...');
    dbClient = await pool.connect();

    const targetResult = await dbClient.query(
      `INSERT INTO budget_targets (budget_id, category_id, target_amount)
       VALUES ($1, $2, $3) RETURNING id`,
      [budgetId, categoryId, BUDGET_LIMIT]
    );
    console.log(`✓ Budget target created ($${BUDGET_LIMIT})`);

    // Set custom alert thresholds
    console.log('\n[THRESHOLDS] Setting custom alert thresholds...');
    const thresholdRes = await client.put(`/alerts/preferences/${categoryId}`, {
      alertThresholdPercentage: 70,
      criticalThresholdPercentage: 90,
    });

    if (thresholdRes.status !== 200) {
      console.error('✗ Failed to set thresholds:', thresholdRes.data);
      return;
    }

    console.log('✓ Warning threshold: 70%');
    console.log('✓ Critical threshold: 90%');

    // Test 1: 50% spending (should NOT trigger alert)
    console.log('\n[TEST 1] Spend $500 (50% of budget)');
    const trans1 = await client.post('/transactions', {
      transactionDate: currentDate.toISOString().split('T')[0],
      amount: 500,
      description: 'Test 50% spending',
      categoryId,
      budgetId,
    });

    if (trans1.status !== 201) {
      console.error('✗ Transaction failed:', trans1.data);
      return;
    }

    const check1 = await client.get(`/alerts/check/${budgetId}`);
    const alerts1 = check1.data.alerts || [];
    console.log(`  Alerts triggered: ${alerts1.length}`);
    if (alerts1.length === 0) {
      console.log('  ✓ PASS: No alert at 50%');
    } else {
      console.log('  ✗ FAIL: Alert triggered at 50%');
    }

    // Test 2: 75% spending (should trigger WARNING)
    console.log('\n[TEST 2] Add $250 more ($750 total = 75% of budget)');
    const trans2 = await client.post('/transactions', {
      transactionDate: currentDate.toISOString().split('T')[0],
      amount: 250,
      description: 'Test 75% spending',
      categoryId,
      budgetId,
    });

    if (trans2.status !== 201) {
      console.error('✗ Transaction failed:', trans2.data);
      return;
    }

    const check2 = await client.get(`/alerts/check/${budgetId}`);
    const alerts2 = check2.data.alerts || [];
    console.log(`  Alerts triggered: ${alerts2.length}`);

    if (alerts2.length > 0) {
      const alert = alerts2[0];
      console.log(`  Spending: $${alert.currentSpending} / $${alert.budgetTarget}`);
      console.log(`  Percentage: ${(alert.percentageOfBudget).toFixed(1)}%`);
      console.log(`  Alert severity: ${alert.severity}`);
      if (alert.severity === 'warning') {
        console.log('  ✓ PASS: WARNING alert at 75%');
      } else if (alert.severity === 'critical') {
        console.log('  ✗ FAIL: CRITICAL alert (expected WARNING)');
      }
    } else {
      console.log('  ✗ FAIL: No alert triggered (expected WARNING)');
    }

    // Test 3: 95% spending (should trigger CRITICAL)
    console.log('\n[TEST 3] Add $200 more ($950 total = 95% of budget)');
    const trans3 = await client.post('/transactions', {
      transactionDate: currentDate.toISOString().split('T')[0],
      amount: 200,
      description: 'Test 95% spending',
      categoryId,
      budgetId,
    });

    if (trans3.status !== 201) {
      console.error('✗ Transaction failed:', trans3.data);
      return;
    }

    const check3 = await client.get(`/alerts/check/${budgetId}`);
    const alerts3 = check3.data.alerts || [];
    console.log(`  Alerts triggered: ${alerts3.length}`);

    if (alerts3.length > 0) {
      const alert = alerts3[alerts3.length - 1];
      console.log(`  Spending: $${alert.currentSpending} / $${alert.budgetTarget}`);
      console.log(`  Percentage: ${(alert.percentageOfBudget).toFixed(1)}%`);
      console.log(`  Alert severity: ${alert.severity}`);
      if (alert.severity === 'critical') {
        console.log('  ✓ PASS: CRITICAL alert at 95%');
      } else if (alert.severity === 'warning') {
        console.log('  ✗ FAIL: WARNING alert (expected CRITICAL)');
      }
    } else {
      console.log('  ✗ FAIL: No alert triggered (expected CRITICAL)');
    }

    // Test 4: Get active alerts
    console.log('\n[TEST 4] Verify active alerts for user');
    const activeRes = await client.get('/alerts/active');
    const activeAlerts = activeRes.data.alerts || [];
    console.log(`  Active alerts: ${activeAlerts.length}`);

    if (activeAlerts.length > 0) {
      console.log('  ✓ PASS: Active alerts retrieved');
      activeAlerts.forEach((alert: any, idx: number) => {
        console.log(`    Alert ${idx + 1}: ${alert.severity.toUpperCase()} at ${(alert.percentageOfBudget).toFixed(1)}%`);
      });
    } else {
      console.log('  Note: No active alerts (may be expected depending on test order)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('ALERT THRESHOLD TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\nTest error:', error.message);
  } finally {
    if (dbClient) {
      dbClient.release();
    }
    process.exit(0);
  }
}

test();
