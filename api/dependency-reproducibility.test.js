import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const policy = readFileSync(new URL('../ops/DEPENDENCY_REPRODUCIBILITY.md', import.meta.url), 'utf8');
const lockfileUrl = new URL('../package-lock.json', import.meta.url);

function floating(specifier) {
  return typeof specifier === 'string'
    && (specifier === 'latest' || specifier === '*' || specifier.trim() === '');
}

test('dependency reproducibility policy defines npm lockfile and npm ci release state', () => {
  assert.match(policy, /Commit `package-lock\.json`/i);
  assert.match(policy, /npm ci/i);
  assert.match(policy, /clean checkout/i);
});

test('current non-reproducible dependency state is never silently represented as verified', () => {
  const declarations = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };
  const floatingDependencies = Object.entries(declarations)
    .filter(([, specifier]) => floating(specifier))
    .map(([name]) => name);
  const hasLockfile = existsSync(lockfileUrl);

  if (floatingDependencies.length > 0 || !hasLockfile) {
    assert.match(policy, /must not be considered production-reproducible/i);
    assert.match(policy, /not verified/i);
    assert.match(policy, /release evidence index and PR must continue to show this as unresolved work/i);
  }
});

test('once a lockfile exists it must identify the same package name and lockfile format', () => {
  if (!existsSync(lockfileUrl)) return;
  const lock = JSON.parse(readFileSync(lockfileUrl, 'utf8'));
  assert.equal(lock.name, packageJson.name);
  assert.ok(Number(lock.lockfileVersion) >= 2);
});
