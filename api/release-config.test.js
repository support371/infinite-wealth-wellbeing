import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function text(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function json(path) {
  return JSON.parse(text(path));
}

test('Vercel build runs production tests before bundle build', () => {
  const config = json('vercel.json');
  assert.equal(config.buildCommand, 'npm run test:production && npm run build');
});

test('production test script discovers every top-level API test file', () => {
  const pkg = json('package.json');
  assert.equal(pkg.scripts['test:production'], 'node --test api/*.test.js');
});

test('staff client dependency is declared without exposing service-role credentials to browser source', () => {
  const pkg = json('package.json');
  assert.ok(pkg.dependencies['@supabase/supabase-js']);
  const adminSource = text('src/admin/AdminApp.jsx');
  const historySource = text('src/admin/HistoryApp.jsx');
  assert.equal(adminSource.includes('IWW_SUPABASE_SERVICE_ROLE_KEY'), false);
  assert.equal(historySource.includes('IWW_SUPABASE_SERVICE_ROLE_KEY'), false);
  assert.match(adminSource, /VITE_IWW_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(historySource, /VITE_IWW_SUPABASE_PUBLISHABLE_KEY/);
});

test('public clean routes fail safely to the prelaunch shell while staff routes resolve explicitly', () => {
  const config = json('vercel.json');
  const rewrites = Object.fromEntries(config.rewrites.map((entry) => [entry.source, entry.destination]));
  assert.equal(rewrites['/contact'], '/contact.html');
  assert.equal(rewrites['/membership/apply'], '/membership-apply.html');
  assert.equal(rewrites['/donate'], '/donate.html');
  assert.equal(rewrites['/trust-center'], '/trust-center.html');
  assert.equal(rewrites['/trust-center/:path*'], '/trust-center.html');
  assert.equal(rewrites['/admin'], '/admin.html');
  assert.equal(rewrites['/admin/history'], '/admin-history.html');
  assert.equal(rewrites['/((?!api|_next|.*\\..*).*)'], '/prelaunch.html');
});

test('staff routes use private no-store noindex no-referrer and deny framing', () => {
  const config = json('vercel.json');
  for (const source of ['/admin', '/admin/(.*)']) {
    const entry = config.headers.find((item) => item.source === source);
    assert.ok(entry, `missing protected headers for ${source}`);
    const headers = Object.fromEntries(entry.headers.map((header) => [header.key.toLowerCase(), header.value]));
    assert.match(headers['x-robots-tag'], /noindex/);
    assert.match(headers['cache-control'], /private/);
    assert.match(headers['cache-control'], /no-store/);
    assert.equal(headers['x-frame-options'], 'DENY');
    assert.equal(headers['referrer-policy'], 'no-referrer');
  }
});

test('Vite build includes both staff entrypoints', () => {
  const vite = text('vite.config.js');
  assert.match(vite, /admin:\s*resolve\(process\.cwd\(\), 'admin\.html'\)/);
  assert.match(vite, /adminHistory:\s*resolve\(process\.cwd\(\), 'admin-history\.html'\)/);
});

test('legacy SPA is explicitly prevented from being indexed as the release surface', () => {
  const config = json('vercel.json');
  const legacyHeaders = config.headers.find((entry) => entry.source === '/index.html');
  assert.ok(legacyHeaders);
  const headerMap = Object.fromEntries(legacyHeaders.headers.map((header) => [header.key.toLowerCase(), header.value]));
  assert.match(headerMap['x-robots-tag'], /noindex/);
  assert.match(headerMap['cache-control'], /no-store/);
});

test('legacy metadata no longer advertises unverified member volume or canonical domain', () => {
  const legacyIndex = text('index.html');
  assert.equal(legacyIndex.includes('Join thousands of members'), false);
  assert.equal(legacyIndex.includes('rel="canonical"'), false);
  assert.equal(legacyIndex.includes('Pre-launch:'), true);
});

test('donation release gate contains no payment form or card input', () => {
  const donation = text('donate.html');
  assert.equal(/<form\b/i.test(donation), false);
  assert.equal(/type=["'](?:number|text)["'][^>]*(?:card|cvv|cvc)/i.test(donation), false);
  assert.match(donation, /checkout is not active yet/i);
  assert.match(donation, /No payment data is collected/i);
});

test('trust center explicitly distinguishes blocked policy work', () => {
  const trust = text('trust-center.html');
  assert.match(trust, /Privacy Policy/);
  assert.match(trust, /Terms of Use/);
  assert.match(trust, /Medical\/well-being/);
  assert.match(trust, /financial-information disclaimers/);
});

test('release candidate advertises only implemented workflows as available', () => {
  const release = text('prelaunch.html');
  assert.match(release, /Validated contact submission workflow/);
  assert.match(release, /Membership-interest application/);
  assert.match(release, /Still behind release gates/);
  assert.match(release, /Investment\/advisory service claims/);
  assert.match(release, /Health\/well-being efficacy/);
});
