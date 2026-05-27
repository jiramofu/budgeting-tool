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
  console.log('='.repeat(80));
  console.log('PHASE 2: ALERT THRESHOLD VERIFICATION TEST');
  console.log('='.repeat(80));

  try {
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
    console.log('✓ User created');

    // Get a category
    const categoriesRes = await client.get('/categories');
    if (!Array.isArray(categoriesRes.data) || categoriesRes.data.length === 0) {
      console.error('✗ No categories found');
      return;
    }
    categoryId = categoriesRes.data[0].id;
    console.log(`✓ Category selected: ${categoryId}`);

    // Create budget with $1000 limit
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
    console.log(`✓ Budget created: $${BUDGET_LIMIT} limit`);

    // Set custom alert thresholds: 70% warning, 90% critical
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
    await client.post('/transactions', {
      transactionDate: currentDate.toISOString().split('T')[0],
      amount: 500,
      description: 'Test 50% spending',
      categoryId,
      budgetId,
    });

    const check1 = await client.get(`/alerts/check/${budgetId}`);
    const alerts1 = check1.data.alerts || [];
    console.log(`  Alerts triggered: ${alerts1.length}`);
    if (alerts1.length === 0) {
      console.log('  ✓ Correct: No alert at 50%');
    } else {
      console.log('  ✗ Unexpected: Alert triggered at 50%');
    }

    // Test 2: Add to 75% spending (should trigger WARNING)
    console.log('\n[TEST 2] Add $250 more ($750 total = 75% of budget)');
    await client.post('/transactions', {
      transactionDate: currentDate.toISOString().split('T')[0],
      amount: 250,
      description: 'Test 75% spending',
      categoryId,
      budgetId,
    });

    const check2 = await client.get(`/alerts/check/${budgetId}`);
    const alerts2 = check2.data.alerts || [];
    console.log(`  Alerts triggered: ${alerts2.length}`);

    if (alerts2.length > 0) {
      const alert = alerts2[0];
      console.log(`  Alert severity: ${alert.severity}`);
      console.log(`  Spending: $${alert.current_spending} / $${alert.budget_target}`);
      if (alert.severity === 'warning') {
        console.log('  ✓ Correct: WARNING alert at 75%');
      } else if (alert.severity === 'critical') {
        console.log('  ✗ Wrong: CRITICAL alert (expected WARNING)');
      }
    } else {
      console.log('  ✗ No alert triggered (expected WARNING at 75%)');
    }

    // Test 3: Add to 95% spending (should trigger CRITICAL)
    console.log('\n[TEST 3] Add $200 more ($950 total = 95% of budget)');
    await client.post('/transactions', {
      transactionDate: currentDate.toISOString().split('T')[0],
      amount: 200,
      description: 'Test 95% spending',
      categoryId,
      budgetId,
    });

    const check3 = await client.get(`/alerts/check/${budgetId}`);
    const alerts3 = check3.data.alerts || [];
    console.log(`  Alerts triggered: ${alerts3.length}`);

    if (alerts3.length > 0) {
      const alert = alerts3[alerts3.length - 1]; // Get most recent
      console.log(`  Alert severity: ${alert.severity}`);
      console.log(`  Spending: $${alert.current_spending} / $${alert.budget_target}`);
      if (alert.severity === 'critical') {
        console.log('  ✓ Correct: CRITICAL alert at 95%');
      } else if (alert.severity === 'warning') {
        console.log('  ✗ Wrong: WARNING alert (expected CRITICAL)');
      }
    } else {
      console.log('  ✗ No alert triggered (expected CRITICAL at 95%)');
    }

    // Test 4: Verify active alerts
    console.log('\n[TEST 4] Verify active alerts');
    const activeRes = await client.get('/alerts/active');
    const activeAlerts = activeRes.data.alerts || [];
    console.log(`  Active alerts for user: ${activeAlerts.length}`);

    activeAlerts.forEach((alert: any, idx: number) => {
      console.log(`  Alert ${idx + 1}:`);
      console.log(`    - Severity: ${alert.severity}`);
      console.log(`    - Category: ${alert.categoryId}`);
      console.log(`    - Spending: ${(alert.percentageOfBudget).toFixed(1)}% of budget`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('ALERT THRESHOLD TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\nTest error:', error.message);
  }

  process.exit(0);
}

test();
