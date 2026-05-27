import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

const client = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('\n========================================');
  console.log('PHASE 3 COMPLETION VERIFICATION TEST');
  console.log('========================================\n');

  try {
    // Step 1: Signup
    console.log('📝 Step 1: Creating test user...');
    const signupRes = await client.post('/auth/signup', {
      email: `phase3-test-${Date.now()}@example.com`,
      password: 'Test123!',
      name: 'Phase 3 Tester',
    });

    if (signupRes.status !== 201) {
      throw new Error(`Signup failed with status ${signupRes.status}`);
    }

    const token = signupRes.data.token;
    const userId = signupRes.data.user.id;
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log(`✓ User created (ID: ${userId})\n`);

    // Step 2: Create test budget
    console.log('💰 Step 2: Creating test budget...');
    const budgetRes = await client.post('/budgets', {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalIncome: 5000,
    });

    if (budgetRes.status !== 201) {
      throw new Error(`Budget creation failed with status ${budgetRes.status}`);
    }

    const budgetId = budgetRes.data.id;
    console.log(`✓ Budget created (ID: ${budgetId})\n`);

    // Step 3: Create test categories
    console.log('🏷️  Step 3: Creating test categories...');
    const categories = [];
    for (const name of ['Groceries', 'Utilities', 'Dining', 'Entertainment']) {
      const catRes = await client.post('/categories', { name, type: 'variable' });
      if (catRes.status === 201) {
        categories.push({ id: catRes.data.id, name });
      }
    }
    console.log(`✓ ${categories.length} categories created\n`);

    // Step 4: Create test transactions
    console.log('💳 Step 4: Creating test transactions...');
    const transactions = [];
    const descriptions = [
      'Whole Foods Grocery',
      'Electric Bill',
      'Starbucks Coffee',
      'Netflix Subscription',
      'Restaurant Dinner',
      'Gym Membership',
    ];

    for (let i = 0; i < descriptions.length; i++) {
      const catIdx = i % categories.length;
      const txRes = await client.post('/transactions', {
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        amount: 20 + Math.random() * 100,
        description: descriptions[i],
        category_id: categories[catIdx].id,
        transaction_type: 'expense',
      });
      if (txRes.status === 201) {
        transactions.push(txRes.data);
      }
    }
    console.log(`✓ ${transactions.length} test transactions created\n`);

    // Step 5: Test Advanced Search
    console.log('🔍 TESTING SEARCH FUNCTIONALITY');
    console.log('================================\n');

    // Test 5a: Basic search
    console.log('TEST 1: Basic transaction search (all)');
    const search1 = await client.post('/search', { filters: {} });
    results.push({
      name: 'Basic search',
      passed: search1.status === 200,
      details: `Found ${search1.data?.data?.total || 0} transactions`,
      error: search1.status !== 200 ? search1.data?.error : undefined,
    });
    console.log(
      `${search1.status === 200 ? '✓' : '✗'} Status: ${search1.status}, Results: ${search1.data?.data?.total || 0}\n`
    );

    // Test 5b: Search by description
    console.log('TEST 2: Search by description (keyword: "Coffee")');
    const search2 = await client.post('/search', {
      filters: { description: 'Coffee' },
    });
    results.push({
      name: 'Search by description',
      passed: search2.status === 200,
      details: `Found ${search2.data?.data?.total || 0} matching transactions`,
      error: search2.status !== 200 ? search2.data?.error : undefined,
    });
    console.log(
      `${search2.status === 200 ? '✓' : '✗'} Status: ${search2.status}, Results: ${search2.data?.data?.total || 0}\n`
    );

    // Test 5c: Search by amount range
    console.log('TEST 3: Search by amount range ($50-$100)');
    const search3 = await client.post('/search', {
      filters: { minAmount: 50, maxAmount: 100 },
    });
    results.push({
      name: 'Search by amount range',
      passed: search3.status === 200,
      details: `Found ${search3.data?.data?.total || 0} transactions in range`,
      error: search3.status !== 200 ? search3.data?.error : undefined,
    });
    console.log(
      `${search3.status === 200 ? '✓' : '✗'} Status: ${search3.status}, Results: ${search3.data?.data?.total || 0}\n`
    );

    // Test 5d: Search suggestions (autocomplete)
    console.log('TEST 4: Search suggestions (autocomplete with "Starbucks")');
    const search4 = await client.get('/search/suggestions?term=Star&limit=5');
    results.push({
      name: 'Search suggestions',
      passed: search4.status === 200,
      details: `Got ${search4.data?.data?.suggestions?.length || 0} suggestions`,
      error: search4.status !== 200 ? search4.data?.error : undefined,
    });
    console.log(
      `${search4.status === 200 ? '✓' : '✗'} Status: ${search4.status}, Suggestions: ${JSON.stringify(
        search4.data?.data?.suggestions || []
      )}\n`
    );

    // Test 5e: Save search
    console.log('TEST 5: Save search query');
    const search5 = await client.post('/search/saved', {
      name: 'Expensive Transactions',
      description: 'All transactions over $50',
      filters: { minAmount: 50 },
    });
    results.push({
      name: 'Save search',
      passed: search5.status === 200,
      details: `Saved search ID: ${search5.data?.data?.id || 'unknown'}`,
      error: search5.status !== 200 ? search5.data?.error : undefined,
    });
    console.log(
      `${search5.status === 200 ? '✓' : '✗'} Status: ${search5.status}, Search ID: ${search5.data?.data?.id || 'error'}\n`
    );

    // Test 5f: Get saved searches
    console.log('TEST 6: Retrieve saved searches');
    const search6 = await client.get('/search/saved');
    results.push({
      name: 'Get saved searches',
      passed: search6.status === 200,
      details: `Found ${search6.data?.data?.searches?.length || 0} saved searches`,
      error: search6.status !== 200 ? search6.data?.error : undefined,
    });
    console.log(
      `${search6.status === 200 ? '✓' : '✗'} Status: ${search6.status}, Count: ${search6.data?.data?.searches?.length || 0}\n`
    );

    // Test 5g: Toggle favorite
    if (search5.data?.data?.id) {
      console.log('TEST 7: Toggle search as favorite');
      const search7 = await client.put(`/search/saved/${search5.data.data.id}/favorite`);
      results.push({
        name: 'Toggle favorite',
        passed: search7.status === 200,
        details: search7.data?.data?.message,
        error: search7.status !== 200 ? search7.data?.error : undefined,
      });
      console.log(`${search7.status === 200 ? '✓' : '✗'} Status: ${search7.status}\n`);
    }

    // Test 5h: Popular search terms
    console.log('TEST 8: Get popular search terms');
    const search8 = await client.get('/search/popular?limit=10');
    results.push({
      name: 'Popular search terms',
      passed: search8.status === 200,
      details: `Got ${search8.data?.data?.terms?.length || 0} popular terms`,
      error: search8.status !== 200 ? search8.data?.error : undefined,
    });
    console.log(
      `${search8.status === 200 ? '✓' : '✗'} Status: ${search8.status}, Terms: ${search8.data?.data?.terms?.length || 0}\n`
    );

    // Step 6: Test Templates
    console.log('📋 TESTING TEMPLATES FUNCTIONALITY');
    console.log('==================================\n');

    // Test 6a: Get all templates
    console.log('TEST 9: Get all budget templates');
    const templates1 = await client.get('/templates');
    results.push({
      name: 'Get all templates',
      passed: templates1.status === 200,
      details: `Found ${templates1.data?.length || 0} templates`,
      error: templates1.status !== 200 ? templates1.data?.error : undefined,
    });
    console.log(
      `${templates1.status === 200 ? '✓' : '✗'} Status: ${templates1.status}, Count: ${templates1.data?.length || 0}\n`
    );

    // Test 6b: Get single template
    if (templates1.data && templates1.data.length > 0) {
      const templateId = templates1.data[0].id;
      console.log(`TEST 10: Get single template (ID: ${templateId})`);
      const templates2 = await client.get(`/templates/${templateId}`);
      results.push({
        name: 'Get single template',
        passed: templates2.status === 200,
        details: `Template: ${templates2.data?.name || 'unknown'}`,
        error: templates2.status !== 200 ? templates2.data?.error : undefined,
      });
      console.log(
        `${templates2.status === 200 ? '✓' : '✗'} Status: ${templates2.status}, Name: ${templates2.data?.name || 'error'}\n`
      );

      // Test 6c: Apply template
      console.log(`TEST 11: Apply template to budget`);
      const templates3 = await client.post(`/templates/${templateId}/apply`, {
        budgetId,
      });
      results.push({
        name: 'Apply template',
        passed: templates3.status === 201,
        details: `Created ${templates3.data?.categories?.length || 0} categories`,
        error: templates3.status !== 201 ? templates3.data?.error : undefined,
      });
      console.log(
        `${templates3.status === 201 ? '✓' : '✗'} Status: ${templates3.status}, Categories: ${templates3.data?.categories?.length || 0}\n`
      );
    }

    // Test 6d: Category suggestions
    console.log('TEST 12: Get category suggestions');
    const templates4 = await client.get('/templates/suggestions/categories?limit=5');
    results.push({
      name: 'Category suggestions',
      passed: templates4.status === 200,
      details: `Got ${templates4.data?.length || 0} suggestions`,
      error: templates4.status !== 200 ? templates4.data?.error : undefined,
    });
    console.log(
      `${templates4.status === 200 ? '✓' : '✗'} Status: ${templates4.status}, Count: ${templates4.data?.length || 0}\n`
    );

    // Test 6e: Category stats
    console.log('TEST 13: Get category statistics');
    const templates5 = await client.get('/templates/stats/categories');
    results.push({
      name: 'Category stats',
      passed: templates5.status === 200,
      details: `Total categories: ${templates5.data?.totalCategories || 0}`,
      error: templates5.status !== 200 ? templates5.data?.error : undefined,
    });
    console.log(
      `${templates5.status === 200 ? '✓' : '✗'} Status: ${templates5.status}, Stats: ${JSON.stringify(templates5.data || {})}\n`
    );
  } catch (error: any) {
    console.error('❌ Test execution error:', error.message);
    results.push({
      name: 'Test execution',
      passed: false,
      error: error.message,
    });
  }

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  results.forEach((result, idx) => {
    const status = result.passed ? '✓' : '✗';
    console.log(`${idx + 1}. ${status} ${result.name}`);
    if (result.details) console.log(`   Details: ${result.details}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });

  console.log(
    `\n📊 Results: ${passed}/${total} tests passed (${percentage}%)\n`
  );

  if (passed === total) {
    console.log('🎉 PHASE 3 IMPLEMENTATION COMPLETE! All tests passed.\n');
  } else {
    console.log(
      `⚠️  ${total - passed} test(s) failed. Review the errors above.\n`
    );
  }

  process.exit(passed === total ? 0 : 1);
}

runTests();
