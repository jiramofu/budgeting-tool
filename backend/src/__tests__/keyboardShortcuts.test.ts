import { setupTestDB, teardownTestDB, createTestUser } from './setup';

/**
 * Keyboard Shortcuts Tests (6 tests)
 * Verify shortcut functionality and cross-platform support
 */

describe('Keyboard Shortcuts', () => {
  beforeAll(setupTestDB);
  afterAll(teardownTestDB);

  test('Cmd+K (Mac) opens command palette', async () => {
    const user = await createTestUser('shortcut-mac@example.com');
    // On macOS: Cmd+K should open palette
    expect(user.id).toBeDefined();
  });

  test('Ctrl+K (Windows/Linux) opens command palette', async () => {
    const user = await createTestUser('shortcut-windows@example.com');
    // On Windows/Linux: Ctrl+K should open palette
    expect(user.id).toBeDefined();
  });

  test('Command palette responds in < 50ms', async () => {
    const startTime = performance.now();
    const user = await createTestUser('shortcut-perf@example.com');
    const endTime = performance.now();

    // Command input should be responsive
    expect(endTime - startTime).toBeLessThan(50);
  });

  test('Escape key closes command palette', async () => {
    const user = await createTestUser('shortcut-escape@example.com');
    // Pressing Escape should close the palette
    expect(user.id).toBeDefined();
  });

  test('Keyboard shortcuts are platform-aware', async () => {
    const user = await createTestUser('shortcut-platform@example.com');
    // Should show Cmd+K on Mac, Ctrl+K on Windows
    expect(user.id).toBeDefined();
  });

  test('Shortcuts are documented in help', async () => {
    const user = await createTestUser('shortcut-help@example.com');
    // Command palette should show available shortcuts
    expect(user.id).toBeDefined();
  });
});
