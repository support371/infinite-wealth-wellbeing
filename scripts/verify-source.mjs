import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx)$/.test(entry)) results.push(full);
  }
  return results;
}

const browserFiles = walk(join(root, 'src'));
const forbiddenBrowserSecrets = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'HUBSPOT_ACCESS_TOKEN',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  'IWW_INTEGRATION_ENCRYPTION_KEY',
  'IWW_EMAIL_DELIVERY_SECRET',
];

for (const file of browserFiles) {
  const source = readFileSync(file, 'utf8');
  for (const token of forbiddenBrowserSecrets) {
    if (source.includes(token)) failures.push(`${relative(root, file)} references server-only variable ${token}`);
  }
  if (/support371-gem-enterprise|gemcybersecurityassist\.com/i.test(source)) {
    failures.push(`${relative(root, file)} contains a GEM deployment/domain reference`);
  }
}

const supabaseSource = readFileSync(join(root, 'src/lib/supabase.js'), 'utf8');
for (const required of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', "flowType: 'pkce'"]) {
  if (!supabaseSource.includes(required)) failures.push(`src/lib/supabase.js missing ${required}`);
}

const authSource = readFileSync(join(root, 'src/auth/AuthProvider.jsx'), 'utf8');
if (authSource.includes('x-demo-user') || authSource.includes('x-demo-roles')) failures.push('private IWW auth still contains demo-header authentication');
if (!authSource.includes('onAuthStateChange')) failures.push('IWW auth does not restore/listen for Supabase session state');

const serverSource = readFileSync(join(root, 'server/iwwServer.js'), 'utf8');
for (const required of ['SUPABASE_SERVICE_ROLE_KEY', 'authenticateIwwRequest', 'requireOrganizationRole', 'isSameOriginMutation']) {
  if (!serverSource.includes(required)) failures.push(`server/iwwServer.js missing ${required}`);
}

const entrySource = readFileSync(join(root, 'src/main.jsx'), 'utf8');
if (!entrySource.includes("import('./App.jsx')")) failures.push('public IWW site preservation entrypoint is missing');
if (!entrySource.includes('IwwSaaSApp')) failures.push('private IWW SaaS entrypoint is missing');

if (failures.length) {
  console.error('IWW source verification failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`IWW source verification passed (${browserFiles.length} browser source files scanned).`);
