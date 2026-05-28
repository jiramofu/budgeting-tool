import { Phase4ProjectionService } from './src/services/phase4-projection-service';

async function diagnose() {
  console.log('=== Phase 4 Route Diagnostics ===\n');

  try {
    console.log('1. Testing Phase4ProjectionService import...');
    console.log('   Service type:', typeof Phase4ProjectionService);
    console.log('   Service keys:', Object.keys(Phase4ProjectionService));
    console.log('   ✓ Service imported successfully\n');

    console.log('2. Testing getProjectionSummary method...');
    // Call with a test user ID that doesn't have data
    const summary = await Phase4ProjectionService.getProjectionSummary(999);
    console.log('   Result:', JSON.stringify(summary, null, 2).substring(0, 200));
    console.log('   ✓ Method executed successfully\n');

    console.log('3. Testing getRecurringItems method...');
    const items = await Phase4ProjectionService.getRecurringItems(999);
    console.log('   Result count:', items.length);
    console.log('   ✓ Method executed successfully\n');

    console.log('4. Testing projectCashFlow method...');
    const projection = await Phase4ProjectionService.projectCashFlow(999, 10);
    console.log('   Projection days:', projection.length);
    console.log('   ✓ Method executed successfully\n');

    console.log('✅ All Phase 4 services are functional!');
    console.log('\nThe routes should be working. If you\'re still getting 404s,');
    console.log('the issue may be with route mounting or middleware.');

  } catch (error: any) {
    console.error('❌ Error during diagnostics:');
    console.error('   Error type:', error.name);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }

  process.exit(0);
}

diagnose();
