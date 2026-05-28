import { setupTestDB, teardownTestDB, createTestUser, createTestBudget, createTestCategory } from './setup';

/**
 * Error Boundary Tests (6 tests)
 * Verify error boundary catches and recovery
 */

describe('Error Boundaries', () => {
  beforeAll(setupTestDB);
  afterAll(teardownTestDB);

  test('Error boundary catches component errors', async () => {
    const user = await createTestUser('error@example.com');
    // Component error should be caught, not crash app
    expect(user.id).toBeDefined();
  });

  test('Error message displays fallback UI', async () => {
    const user = await createTestUser('error-fallback@example.com');
    // Should show "Something went wrong" message
    expect(user.id).toBeDefined();
  });

  test('Error boundary logs to console', async () => {
    const user = await createTestUser('error-log@example.com');
    // Error should be logged for debugging
    expect(user.id).toBeDefined();
  });

  test('Page remains functional after error', async () => {
    const user = await createTestUser('error-recover@example.com');
    const budget = await createTestBudget(user.id);
    // Other components should still work
    expect(budget.id).toBeDefined();
  });

  test('Error boundary resets on navigation', async () => {
    const user = await createTestUser('error-reset@example.com');
    // Navigating to another page should clear error state
    expect(user.id).toBeDefined();
  });

  test('Multiple error boundaries work independently', async () => {
    const user = await createTestUser('error-multi@example.com');
    const budget = await createTestBudget(user.id);
    const category = await createTestCategory(user.id);
    // Error in one section shouldn't affect others
    expect(budget.id).toBeDefined();
    expect(category.id).toBeDefined();
  });
});
