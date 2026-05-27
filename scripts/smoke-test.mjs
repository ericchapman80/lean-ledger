#!/usr/bin/env node
// End-to-end smoke test.
// - default mode exercises mutating and read-only routes against a safe test DB
// - --read-only mode avoids writes and is safe for preview/prod post-deploy checks
// Usage:
//   npm run smoke -- http://localhost:3000
//   npm run smoke -- https://lean-ledger.vercel.app
//   npm run smoke -- http://localhost:3000 --read-only
//
// Safe to re-run: uses tagged meal/weight names so we can clean up.

import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const args = process.argv.slice(2);
const baseUrl = (args.find((arg) => !arg.startsWith('--')) || 'http://localhost:3000').replace(/\/$/, '');
const readOnly = args.includes('--read-only');
const today = new Date().toISOString().split('T')[0];
const SMOKE_TAG = '[smoke]';
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

let passed = 0;
let failed = 0;
const failures = [];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (bypassSecret) {
    headers['x-vercel-protection-bypass'] = bypassSecret;
    headers['x-vercel-set-bypass-cookie'] = 'true';
  }
  const maxAttempts = readOnly || method === 'GET' ? 5 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { status: res.status, data };
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
      await delay(attempt * 1000);
    }
  }

  throw lastError;
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

console.log(`Smoke testing ${baseUrl}${readOnly ? ' (read-only)' : ''}\n`);

await step('Health check', async () => {
  const r = await request('GET', '/api/health');
  assert('GET /api/health → 200', r.status === 200);
  assert('Response has status: ok', r.data?.status === 'ok');
});

await step('Profile: fetch', async () => {
  const r = await request('GET', '/api/profile');
  if (readOnly) {
    assert('GET /api/profile → 200 or 404', r.status === 200 || r.status === 404, `got ${r.status}`);
  } else {
    assert('GET /api/profile → 200 or 404', r.status === 200 || r.status === 404, `got ${r.status}`);
  }
  assert('Profile route is reachable', r.status === 200 || r.status === 404);
});

let mealId = null;

if (!readOnly) {
  await step('Profile: create or update', async () => {
    const r = await request('POST', '/api/profile', {
      age: 30, height: 175, weight: 75,
      gender: 'male', activityLevel: 'moderate', goal: 'maintain', dietStyle: 'balanced', units: 'metric',
    });
    assert('POST /api/profile → 200', r.status === 200, `got ${r.status}`);
    assert('Response includes recommendedMacros', r.data?.recommendedMacros?.calories > 0);
  });

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
}

await step('Meals: fetch today', async () => {
  const r = await request('GET', `/api/meals?date=${today}`);
  assert('GET /api/meals → 200', r.status === 200);
  assert('Array response', Array.isArray(r.data));
  assert('Includes smoke meal', r.data?.some((m) => m.id === mealId));
});

if (!readOnly) {
  await step('Meals: update', async () => {
    if (!mealId) { assert('Skipped (no mealId)', false); return; }
    const r = await request('PUT', `/api/meals/${mealId}`, {
      mealName: `${SMOKE_TAG} brunch`,
      protein: 35, fat: 18, carbs: 55, calories: 522,
    });
    assert('PUT /api/meals/:id → 200', r.status === 200);
    assert('Updated name', r.data?.mealName?.includes('brunch'));
  });
}

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

if (!readOnly) {
  await step('Weight: log', async () => {
    const r = await request('POST', '/api/weight', { date: today, weight: 75 });
    assert('POST /api/weight → 201', r.status === 201, `got ${r.status}`);
  });
}

await step('Weight: fetch', async () => {
  const r = await request('GET', '/api/weight?limit=5');
  assert('GET /api/weight → 200', r.status === 200);
  assert('Array response', Array.isArray(r.data));
});

if (!readOnly) {
  await step('Health metrics: manual entry', async () => {
    const r = await request('POST', '/api/health-metrics', {
      recordedAt: `${today}T07:00`,
      weight: 75,
      bodyFatPercent: 20.5,
      sleepHours: 7.5,
    });
    assert('POST /api/health-metrics → 201', r.status === 201, `got ${r.status}`);
  });
}

await step('Health metrics: fetch', async () => {
  const r = await request('GET', '/api/health-metrics?limit=5');
  assert('GET /api/health-metrics → 200', r.status === 200);
  assert('Array response', Array.isArray(r.data));
});

if (!readOnly) {
  await step('Meals: delete (cleanup)', async () => {
    if (!mealId) { assert('Skipped (no mealId)', false); return; }
    const r = await request('DELETE', `/api/meals/${mealId}`);
    assert('DELETE /api/meals/:id → 200', r.status === 200);
  });
}

console.log(`\n${'─'.repeat(40)}`);
console.log(`Passed: ${passed}   Failed: ${failed}`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ All smoke checks passed');
