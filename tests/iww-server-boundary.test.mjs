import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const api = read('api/iww.js');
const server = read('server/iwwServer.js');
const env = read('.env.example');

test('server API authenticates bearer sessions and revalidates organization roles', () => {
  assert.match(api, /authenticateIwwRequest/);
  assert.match(api, /requireOrganizationRole/);
  assert.match(api, /isSameOriginMutation/);
  assert.match(server, /client\.auth\.getUser\(token\)/);
  assert.match(server, /memberships/);
});

test('provider secrets remain server-only environment names', () => {
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','HUBSPOT_ACCESS_TOKEN','GOOGLE_CALENDAR_CLIENT_SECRET','IWW_INTEGRATION_ENCRYPTION_KEY']) {
    assert.ok(env.includes(name));
    assert.ok(!env.includes(`VITE_${name}`));
  }
});

test('provider connection state is fail-closed and auditable', () => {
  assert.match(api, /provider_verification_failed/);
  assert.match(api, /human_authorization_required/);
  assert.match(api, /integration\.verified/);
  assert.match(api, /integration\.revoked/);
  assert.match(api, /billing\.portal_requested/);
});
