import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const apiRoot = join(root, 'api');

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const full = join(directory, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const apiJavaScript = walk(apiRoot)
  .filter((path) => path.endsWith('.js'))
  .map((path) => relative(root, path).split(sep).join('/'));
const productionFunctions = apiJavaScript.filter((path) => !path.endsWith('.test.js'));

test('Vercel Hobby function budget stays at or below 12 deployable API handlers', () => {
  assert.ok(
    productionFunctions.length <= 12,
    `function budget exceeded: ${productionFunctions.length} deployable JavaScript files under api/: ${productionFunctions.join(', ')}`,
  );
});

test('shared server helpers live outside the Vercel api function-discovery directory', () => {
  assert.equal(productionFunctions.some((path) => path.startsWith('api/_lib/')), false);
  for (const helper of [
    'server/http.js',
    'server/internal-auth.js',
    'server/persistence.js',
    'server/staff-auth.js',
    'server/supabase-server.js',
  ]) {
    assert.doesNotThrow(() => readFileSync(join(root, helper), 'utf8'), `${helper} is missing`);
  }
});

test('all deployable API files are intentional HTTP handlers', () => {
  const expected = new Set([
    'api/health.js',
    'api/inquiries.js',
    'api/membership-applications.js',
    'api/admin/history.js',
    'api/admin/staff.js',
    'api/admin/submissions.js',
    'api/internal/maintenance.js',
    'api/internal/notification-worker.js',
    'api/internal/readiness.js',
  ]);
  assert.deepEqual(new Set(productionFunctions), expected);
});
