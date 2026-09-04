#!/usr/bin/env node

/**
 * Smoke test for audit backend API endpoints
 * Tests soft-fail mode (no DATABASE_URL)
 */

const BATCH_API = 'http://localhost:5173/api/audit-log/batch';
const QUERY_API = 'http://localhost:5173/api/audit-log/query';

async function testBatchEndpoint() {
  console.log('\n📤 Testing POST /api/audit-log/batch...');
  
  const testEvent = {
    eventId: `test-${Date.now()}`,
    timestamp: Date.now(),
    type: 'receipt_fix_applied',
    data: {
      fixKey: 'contrast',
      nodeId: 'test-button',
      ruleId: 'contrast'
    },
    context: {
      teamId: 'test-team',
      userId: 'test-user@example.com',
      surface: 'web-app'
    }
  };
  
  try {
    const response = await fetch(BATCH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [testEvent] })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.accepted === 1) {
      console.log('✅ Batch endpoint working (soft-fail mode)');
      return true;
    } else {
      console.error('❌ Batch endpoint failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Batch endpoint error:', err.message);
    return false;
  }
}

async function testQueryEndpoint() {
  console.log('\n📥 Testing GET /api/audit-log/query...');
  
  try {
    const response = await fetch(`${QUERY_API}?teamId=test-team&limit=10`);
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok && Array.isArray(result.events)) {
      console.log('✅ Query endpoint working (soft-fail mode)');
      return true;
    } else {
      console.error('❌ Query endpoint failed');
      return false;
    }
  } catch (err) {
    console.error('❌ Query endpoint error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Audit Backend API Smoke Tests');
  console.log('Testing soft-fail mode (no DATABASE_URL configured)\n');
  
  const batchOk = await testBatchEndpoint();
  const queryOk = await testQueryEndpoint();
  
  console.log('\n' + '='.repeat(50));
  if (batchOk && queryOk) {
    console.log('✅ All tests passed');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
