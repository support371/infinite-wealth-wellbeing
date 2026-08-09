import { readFileSync } from 'node:fs';

const strict = process.argv.includes('--strict');
const config = JSON.parse(readFileSync(new URL('../config/release-gates.json', import.meta.url), 'utf8'));
const accepted = new Set(['implemented', 'verified']);
const required = config.gates.filter((gate) => gate.requiredForLaunch);
const blocked = required.filter((gate) => !accepted.has(gate.status));

for (const gate of config.gates) {
  const mark = accepted.has(gate.status) ? 'PASS' : gate.requiredForLaunch ? 'BLOCK' : 'HOLD';
  console.log(`${mark.padEnd(5)} ${gate.id.padEnd(32)} ${gate.status} — ${gate.title}`);
  if (!accepted.has(gate.status) && gate.blocker) {
    console.log(`      ${gate.blocker}`);
  }
}

console.log(`\n${required.length - blocked.length}/${required.length} required production gates are launch-clear.`);

if (strict && blocked.length) {
  console.error(`Release blocked by ${blocked.length} required gate${blocked.length === 1 ? '' : 's'}.`);
  process.exitCode = 1;
}
