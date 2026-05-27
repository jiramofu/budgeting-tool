import axios from 'axios';

const API_URL = 'http://localhost:5002/api';
let authToken = '';
let userId = 0;
let categoryId = 0;
let budgetId = 0;

const client = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

async function test() {
  console.log('='.repeat(80));
  console.log('PHASE 3: SEARCH & DISCOVERY TESTING');
  console.log('='.repeat(80));

  try {
    // Setup
    console.log('\n[SETUP] Creating test user...');
    const signupRes = await client.post('/auth/signup', {
      email: `search-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Search Tester',
    });

    if (signupRes.status !== 201) {
      console.error('✗ Signup failed');
      return;
    }

    authToken = signupRes.data.token;
    userId = signupRes.data.userId;
    client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✓ User created');
    console.log('  Token:', authToken.substring(0, 20) + '...');

    // Get category
    const categoriesRes = await client.get('/categories');
    if (!Array.isArray(categoriesRes.data) || categoriesRes.data.length === 0) {
      console.error('✗ No categories found');
      return;
    }
    categoryId = categoriesRes.data[0].id;
    console.log('✓ Category retrieved');

    // Create budget
    const currentDate = new Date();
    const budgetRes = await client.post('/budgets', {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });
    budgetId = budgetRes.data.id;
    console.log('✓ Budget created');

    // Create test transactions
    console.log('\n[DATA SETUP] Creating test transactions...');
    const transactions = [
      { amount: 50, description: 'Grocery Store - Milk and Bread', dayOffset: 5 },
      { amount: 75, description: 'Gas Station - Regular Fuel', dayOffset: 3 },
      { amount: 120, description: 'Grocery Store - Weekly Shopping', dayOffset: 2 },
      { amount: 30, description: 'Coffee Shop - Morning Coffee', dayOffset: 1 },
      { amount: 200, description: 'Restaurant - Dinner', dayOffset: 0 },
    ];

    for (const trans of transactions) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - trans.dayOffset);

      await client.post('/transactions', {
        transactionDate: date.toISOString().split('T')[0],
        amount: trans.amount,
        description: trans.description,
        categoryId,
        budgetId,
      });
    }
    console.log(`✓ Created ${transactions.length} test transactions`);

    // Test 1: Search all transactions
    console.log('\n[TEST 1] Search all transactions (no filters)');
    console.log('  Client baseURL:', client.defaults.baseURL);
    console.log('  Request path: /search');
    console.log('  Full URL:', client.defaults.baseURL + '/search');
    console.log('  Authorization header:', client.defaults.headers.common['Authorization']?.substring(0, 30) + '...');
    const search1 = await client.post('/search', {
      filters: {},
    }, {
      validateStatus: () => true
    });

    console.log('  Response status:', search1.status);
    console.log('  Response headers:', JSON.stringify(search1.headers, null, 2).substring(0, 200));
    if (search1.status === 404 || search1.status !== 200) {
      console.log('  Full response:', JSON.stringify(search1.data));
    }

    if (search1.status === 200) {
      const count = search1.data.data?.results?.length || 0;
      console.log(`  ✓ Found ${count} transactions`);
      if (count === 5) {
        console.log('  ✓ PASS: All 5 transactions returned');
      } else {
        console.log(`  ✗ FAIL: Expected 5, got ${count}`);
      }
    } else {
      console.log(`  ✗ Search failed: ${search1.status}`);
    }

    // Test 2: Search by amount range
    console.log('\n[TEST 2] Search by amount range ($30-$100)');
    const search2 = await client.post('/search', {
      filters: {
        minAmount: 30,
        maxAmount: 100,
      },
    });

    if (search2.status === 200) {
      const results = search2.data.data?.results || [];
      console.log(`  ✓ Found ${results.length} transactions in range`);
      const inRange = results.every((t: any) => t.amount >= 30 && t.amount <= 100);
      if (inRange) {
        console.log('  ✓ PASS: All results within amount range');
      } else {
        console.log('  ✗ FAIL: Some results outside range');
      }
    } else {
      console.log(`  ✗ Search failed: ${search2.status}`);
    }

    // Test 3: Search by description keyword
    console.log('\n[TEST 3] Search by description ("Grocery")');
    const search3 = await client.post('/search', {
      filters: {
        description: 'Grocery',
      },
    });

    if (search3.status === 200) {
      const results = search3.data.data?.results || [];
      console.log(`  ✓ Found ${results.length} transactions`);
      const hasGrocery = results.every((t: any) => t.description.toLowerCase().includes('grocery'));
      if (hasGrocery && results.length === 2) {
        console.log('  ✓ PASS: Found 2 grocery transactions');
      } else {
        console.log(`  ✗ FAIL: Expected 2 grocery transactions, got ${results.length}`);
      }
    } else {
      console.log(`  ✗ Search failed: ${search3.status}`);
    }

    // Test 4: Search suggestions
    console.log('\n[TEST 4] Get search suggestions for "Gas"');
    const suggest = await client.get('/search/suggestions', {
      params: { term: 'Gas', limit: 10 },
    });

    if (suggest.status === 200) {
      const suggestions = suggest.data.data?.suggestions || [];
      console.log(`  ✓ Found ${suggestions.length} suggestions`);
      if (suggestions.length > 0) {
        console.log('  ✓ PASS: Suggestions returned');
      }
    } else {
      console.log(`  ✗ Suggestions failed: ${suggest.status}`);
    }

    // Test 5: Save a search
    console.log('\n[TEST 5] Save a search ("Expensive Groceries")');
    const save = await client.post('/search/saved', {
      name: 'Expensive Groceries',
      description: 'Grocery purchases over $100',
      filters: {
        description: 'Grocery',
        minAmount: 100,
      },
    });

    let savedSearchId = 0;
    if (save.status === 200) {
      savedSearchId = save.data.data?.id || 0;
      console.log(`  ✓ Search saved (ID: ${savedSearchId})`);
    } else {
      console.log(`  ✗ Save failed: ${save.status}`);
    }

    // Test 6: Get saved searches
    console.log('\n[TEST 6] Get all saved searches');
    const getSaved = await client.get('/search/saved');

    if (getSaved.status === 200) {
      const searches = getSaved.data.data?.searches || [];
      console.log(`  ✓ Found ${searches.length} saved searches`);
      if (searches.length > 0) {
        console.log('  ✓ PASS: Saved searches retrieved');
      }
    } else {
      console.log(`  ✗ Get saved failed: ${getSaved.status}`);
    }

    // Test 7: Toggle favorite
    if (savedSearchId > 0) {
      console.log('\n[TEST 7] Toggle search as favorite');
      const toggle = await client.put(`/search/saved/${savedSearchId}/favorite`);

      if (toggle.status === 200) {
        console.log('  ✓ Favorite toggled');
      } else {
        console.log(`  ✗ Toggle failed: ${toggle.status}`);
      }
    }

    // Test 8: Pagination
    console.log('\n[TEST 8] Search with pagination (limit=2, offset=0)');
    const paginate = await client.post('/search', {
      filters: {},
      limit: 2,
      offset: 0,
    });

    if (paginate.status === 200) {
      const results = paginate.data.data?.results || [];
      const total = paginate.data.data?.total || 0;
      const hasMore = paginate.data.data?.hasMore || false;
      console.log(`  ✓ Got ${results.length}/${total} results`);
      console.log(`  ✓ Has more: ${hasMore}`);
      if (results.length === 2 && hasMore) {
        console.log('  ✓ PASS: Pagination working');
      }
    } else {
      console.log(`  ✗ Pagination failed: ${paginate.status}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3 SEARCH TESTING COMPLETE');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\nTest error:', error.message);
  }

  process.exit(0);
}

test();
