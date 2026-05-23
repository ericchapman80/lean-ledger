#!/usr/bin/env node
// End-to-end smoke test. Exercises every API route against a running server.
// Usage:
//   npm run smoke -- http://localhost:3000
//   npm run smoke -- https://lean-ledger.vercel.app
//
// Safe to re-run: uses tagged meal/weight names so we can clean up.

const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const today = new Date().toISOString().split('T')[0];
const SMOKE_TAG = '[smoke]';

let passed = 0;
let failed = 0;
const failures = [];

async function request(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
    failures.push(label);
  }
}

async function step(name, fn) {
  console.log(`\n→ ${name}`);
  try {
    await fn();
  } catch (err) {
    console.log(`  ✗ Threw: ${err.message}`);
    failed++;
    failures.push(name);
  }
}

console.log(`Smoke testing ${baseUrl}\n`);

await step('Health check', async () => {
  const r = await request('GET', '/api/health');
  assert('GET /api/health → 200', r.status === 200);
  assert('Response has status: ok', r.data?.status === 'ok');
});

await step('Profile: create or update', async () => {
  const r = await request('POST', '/api/profile', {
    age: 30, height: 175, weight: 75,
    gender: 'male', activityLevel: 'moderate', goal: 'maintain', units: 'metric',
  });
  assert('POST /api/profile → 200', r.status === 200, `got ${r.status}`);
  assert('Response includes recommendedMacros', r.data?.recommendedMacros?.calories > 0);
});

await step('Profile: fetch', async () => {
  const r = await request('GET', '/api/profile');
  assert('GET /api/profile → 200', r.status === 200);
  assert('Has activeMacros', !!r.data?.activeMacros);
});

let mealId = null;

await step('Meals: create', async () => {
  const r = await request('POST', '/api/meals', {
    date: today,
    mealName: `${SMOKE_TAG} breakfast`,
    protein: 30, fat: 15, carbs: 50, calories: 455,
  });
  assert('POST /api/meals → 201', r.status === 201, `got ${r.status}`);
  assert('Response has id', typeof r.data?.id === 'number');
  mealId = r.data?.id;
});

await step('Meals: fetch today', async () => {
  const r = await request('GET', `/api/meals?date=${today}`);
  assert('GET /api/meals → 200', r.status === 200);
  assert('Array response', Array.isArray(r.data));
  assert('Includes smoke meal', r.data?.some((m) => m.id === mealId));
});

await step('Meals: update', async () => {
  if (!mealId) { assert('Skipped (no mealId)', false); return; }
  const r = await request('PUT', `/api/meals/${mealId}`, {
    mealName: `${SMOKE_TAG} brunch`,
    protein: 35, fat: 18, carbs: 55, calories: 522,
  });
  assert('PUT /api/meals/:id → 200', r.status === 200);
  assert('Updated name', r.data?.mealName?.includes('brunch'));
});

await step('Stats: daily', async () => {
  const r = await request('GET', `/api/stats/daily/${today}`);
  assert('GET /api/stats/daily/:date → 200', r.status === 200);
  assert('Includes totals + targets + progress', r.data?.totals && r.data?.targets && r.data?.progress);
  assert('mealCount > 0', r.data?.mealCount > 0);
});

await step('Stats: trends (last 7d)', async () => {
  const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const r = await request('GET', `/api/stats/trends?startDate=${start}&endDate=${today}`);
  assert('GET /api/stats/trends → 200', r.status === 200);
  assert('Array response', Array.isArray(r.data));
});

await step('Weight: log', async () => {
  const r = await request('POST', '/api/weight', { date: today, weight: 75 });
  assert('POST /api/weight → 201', r.status === 201, `got ${r.status}`);
});

await step('Weight: fetch', async () => {
  const r = await request('GET', '/api/weight?limit=5');
  assert('GET /api/weight → 200', r.status === 200);
  assert('Array response', Array.isArray(r.data));
});

await step('Meals: delete (cleanup)', async () => {
  if (!mealId) { assert('Skipped (no mealId)', false); return; }
  const r = await request('DELETE', `/api/meals/${mealId}`);
  assert('DELETE /api/meals/:id → 200', r.status === 200);
});

console.log(`\n${'─'.repeat(40)}`);
console.log(`Passed: ${passed}   Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ All smoke checks passed');
