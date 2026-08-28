import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('src/app/IwwSaaSApp.jsx');
const auth = read('src/auth/IwwAuthRoutes.jsx');
const entry = read('src/main.jsx');

const requiredRoutes = [
  '/app/overview','/app/wellbeing','/app/wealth','/app/goals','/app/programmes','/app/appointments','/app/messages','/app/documents','/app/tasks','/app/resources','/app/delegated','/app/team','/app/operations','/app/reports','/app/governance','/app/integrations','/app/billing','/app/settings'
];
const authRoutes = ['/auth/sign-in','/auth/sign-up','/auth/forgot-password','/auth/reset-password','/auth/onboarding','/auth/callback'];

test('contains all required protected IWW SaaS route surfaces', () => {
  for (const route of requiredRoutes) assert.ok(app.includes(route), `missing ${route}`);
  assert.match(app, /RoleRoute roles=\{\['owner','admin'\]\}/);
  assert.match(app, /family_delegate/);
});

test('contains complete dedicated IWW auth flow', () => {
  for (const route of authRoutes) assert.ok(auth.includes(route), `missing ${route}`);
  assert.match(auth, /create_iww_organization/);
  assert.match(auth, /accept_iww_invitation/);
  assert.match(auth, /No GEM credentials are accepted here/);
});

test('preserves public IWW while isolating app and auth entrypoints', () => {
  assert.match(entry, /pathname\.startsWith\('\/app\/'\)/);
  assert.match(entry, /pathname\.startsWith\('\/auth\/'\)/);
  assert.match(entry, /import\('\.\/App\.jsx'\)/);
});

test('states the non-diagnostic and non-transactional product boundaries in the live workspace', () => {
  assert.match(app, /does not diagnose or treat medical conditions/);
  assert.match(app, /does not execute trades, move money, or make autonomous investment decisions/);
});
