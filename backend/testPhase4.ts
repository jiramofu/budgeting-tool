import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('\n========================================');
  console.log('Phase 4 - Advanced Analytics & Projections Test Suite');
  console.log('========================================\n');

  // First, we need to authenticate or create a test user
  let userId = 1; // Assuming first user exists
  let token = '';

  try {
    // Try to get or create a test user
    console.log('1. Setting up test user...');

    // Try to login with a known user
    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      token = loginRes.data.token;
      userId = loginRes.data.user.id;
      console.log('✓ Logged in existing test user');
    } catch {
      // If login fails, try to create a new user
      const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
        email: `testuser${Date.now()}@example.com`,
        password: 'password123'
      });
      token = signupRes.data.token;
      userId = signupRes.data.user.id;
      console.log('✓ Created new test user');
    }

    const headers = { Authorization: `Bearer ${token}` };

    console.log(`\n2. Testing Phase 4 Projections Endpoints...\n`);

    // Test GET /api/phase4/projections
    try {
      const res = await axios.get(`${API_BASE}/phase4/projections`, { headers });
      results.push({
        endpoint: 'GET /api/phase4/projections',
        method: 'GET',
        status: res.status,
        success: true,
        message: 'Projection summary retrieved',
        data: res.data.data
      });
      console.log('✓ GET /api/phase4/projections');
      console.log(`  Current Balance: $${res.data.data.currentBalance}`);
      console.log(`  Projected Balance (90d): $${res.data.data.projectedBalance}`);
      console.log(`  Safe Days: ${res.data.data.safeDays}`);
    } catch (err: any) {
      results.push({
        endpoint: 'GET /api/phase4/projections',
        method: 'GET',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ GET /api/phase4/projections:', err.message);
    }

    // Test GET /api/phase4/projections/detailed
    try {
      const res = await axios.get(`${API_BASE}/phase4/projections/detailed`, { headers });
      results.push({
        endpoint: 'GET /api/phase4/projections/detailed',
        method: 'GET',
        status: res.status,
        success: true,
        message: `Retrieved ${res.data.data.days} days of projection data`
      });
      console.log('✓ GET /api/phase4/projections/detailed');
      console.log(`  Days: ${res.data.data.days}`);
    } catch (err: any) {
      results.push({
        endpoint: 'GET /api/phase4/projections/detailed',
        method: 'GET',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ GET /api/phase4/projections/detailed:', err.message);
    }

    // Test GET /api/phase4/projections/recurring
    try {
      const res = await axios.get(`${API_BASE}/phase4/projections/recurring`, { headers });
      results.push({
        endpoint: 'GET /api/phase4/projections/recurring',
        method: 'GET',
        status: res.status,
        success: true,
        message: `Retrieved ${res.data.count} recurring items`
      });
      console.log('✓ GET /api/phase4/projections/recurring');
      console.log(`  Count: ${res.data.count}`);
    } catch (err: any) {
      results.push({
        endpoint: 'GET /api/phase4/projections/recurring',
        method: 'GET',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ GET /api/phase4/projections/recurring:', err.message);
    }

    // Test POST /api/phase4/projections/recurring
    try {
      const res = await axios.post(`${API_BASE}/phase4/projections/recurring`, {
        description: 'Test Monthly Rent',
        amount: 1500,
        frequency: 'monthly',
        start_date: '2026-01-01',
        day_of_month: 1,
        is_income: false
      }, { headers });
      results.push({
        endpoint: 'POST /api/phase4/projections/recurring',
        method: 'POST',
        status: res.status,
        success: true,
        message: 'Recurring item added'
      });
      console.log('✓ POST /api/phase4/projections/recurring');
      console.log(`  Item ID: ${res.data.data.id}`);
    } catch (err: any) {
      results.push({
        endpoint: 'POST /api/phase4/projections/recurring',
        method: 'POST',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ POST /api/phase4/projections/recurring:', err.message);
    }

    // Test POST /api/phase4/projections/refresh
    try {
      const res = await axios.post(`${API_BASE}/phase4/projections/refresh`, {}, { headers });
      results.push({
        endpoint: 'POST /api/phase4/projections/refresh',
        method: 'POST',
        status: res.status,
        success: true,
        message: 'Projections refreshed'
      });
      console.log('✓ POST /api/phase4/projections/refresh');
    } catch (err: any) {
      results.push({
        endpoint: 'POST /api/phase4/projections/refresh',
        method: 'POST',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ POST /api/phase4/projections/refresh:', err.message);
    }

    console.log(`\n3. Testing Phase 4 Analytics Endpoints...\n`);

    // Test GET /api/phase4/analytics/summary
    try {
      const res = await axios.get(`${API_BASE}/phase4/analytics/summary`, { headers });
      results.push({
        endpoint: 'GET /api/phase4/analytics/summary',
        method: 'GET',
        status: res.status,
        success: true,
        message: 'Analytics summary retrieved',
        data: res.data.data
      });
      console.log('✓ GET /api/phase4/analytics/summary');
      if (res.data.data.currentMonth) {
        console.log(`  Current Month Income: $${res.data.data.currentMonth.totalIncome}`);
        console.log(`  Current Month Expenses: $${res.data.data.currentMonth.totalExpenses}`);
        console.log(`  Savings Rate: ${res.data.data.currentMonth.savingsRate}%`);
      }
    } catch (err: any) {
      results.push({
        endpoint: 'GET /api/phase4/analytics/summary',
        method: 'GET',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ GET /api/phase4/analytics/summary:', err.message);
    }

    // Test GET /api/phase4/analytics/month/:year/:month
    try {
      const res = await axios.get(`${API_BASE}/phase4/analytics/month/2026/5`, { headers });
      results.push({
        endpoint: 'GET /api/phase4/analytics/month/:year/:month',
        method: 'GET',
        status: res.status,
        success: true,
        message: 'Month analytics retrieved'
      });
      console.log('✓ GET /api/phase4/analytics/month/2026/5');
    } catch (err: any) {
      results.push({
        endpoint: 'GET /api/phase4/analytics/month/:year/:month',
        method: 'GET',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ GET /api/phase4/analytics/month/2026/5:', err.message);
    }

    // Test GET /api/phase4/trends/seasonal
    try {
      const res = await axios.get(`${API_BASE}/phase4/trends/seasonal`, { headers });
      results.push({
        endpoint: 'GET /api/phase4/trends/seasonal',
        method: 'GET',
        status: res.status,
        success: true,
        message: `Retrieved ${res.data.count} seasonal insights`
      });
      console.log('✓ GET /api/phase4/trends/seasonal');
      console.log(`  Insights Count: ${res.data.count}`);
    } catch (err: any) {
      results.push({
        endpoint: 'GET /api/phase4/trends/seasonal',
        method: 'GET',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ GET /api/phase4/trends/seasonal:', err.message);
    }

    // Test POST /api/phase4/analytics/refresh
    try {
      const res = await axios.post(`${API_BASE}/phase4/analytics/refresh`, {}, { headers });
      results.push({
        endpoint: 'POST /api/phase4/analytics/refresh',
        method: 'POST',
        status: res.status,
        success: true,
        message: 'Analytics refreshed'
      });
      console.log('✓ POST /api/phase4/analytics/refresh');
    } catch (err: any) {
      results.push({
        endpoint: 'POST /api/phase4/analytics/refresh',
        method: 'POST',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ POST /api/phase4/analytics/refresh:', err.message);
    }

    // Test POST /api/phase4/trends/refresh
    try {
      const res = await axios.post(`${API_BASE}/phase4/trends/refresh`, {}, { headers });
      results.push({
        endpoint: 'POST /api/phase4/trends/refresh',
        method: 'POST',
        status: res.status,
        success: true,
        message: 'Trends refreshed'
      });
      console.log('✓ POST /api/phase4/trends/refresh');
    } catch (err: any) {
      results.push({
        endpoint: 'POST /api/phase4/trends/refresh',
        method: 'POST',
        status: err.response?.status || 0,
        success: false,
        message: err.message
      });
      console.log('✗ POST /api/phase4/trends/refresh:', err.message);
    }

    console.log(`\n4. Testing with invalid authentication...\n`);

    // Test without auth header
    try {
      await axios.get(`${API_BASE}/phase4/projections`);
      console.log('✗ Should have been rejected without auth header');
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.log('✓ Correctly rejected request without authentication (401)');
        results.push({
          endpoint: 'GET /api/phase4/projections (no auth)',
          method: 'GET',
          status: 401,
          success: true,
          message: 'Correctly rejected unauthenticated request'
        });
      }
    }

    console.log(`\n========================================`);
    console.log('Test Summary');
    console.log('========================================\n');

    const passCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`Total Tests: ${totalCount}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${totalCount - passCount}`);
    console.log(`Success Rate: ${((passCount / totalCount) * 100).toFixed(1)}%\n`);

    if (totalCount - passCount > 0) {
      console.log('Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  ✗ ${r.endpoint}: ${r.message}`);
      });
    } else {
      console.log('✓ All Phase 4 tests passed!\n');
    }

  } catch (error: any) {
    console.error('Fatal error during testing:', error.message);
  }
}

// Run the tests
runTests().then(() => {
  console.log('\nTest suite complete.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
