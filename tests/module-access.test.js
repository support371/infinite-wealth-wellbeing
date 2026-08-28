import { describe, expect, it } from 'vitest';
import { canAccessModule, canWriteModule, modules } from '../src/app/moduleConfig.js';

describe('role-aware application modules', () => {
  it('hides organization governance from members and delegates', () => {
    expect(canAccessModule(modules.governance,'member')).toBe(false);
    expect(canAccessModule(modules.team,'family_delegate')).toBe(false);
  });
  it('allows owners to administer protected modules', () => {
    expect(canAccessModule(modules.integrations,'owner')).toBe(true);
    expect(canWriteModule(modules.integrations,'owner')).toBe(true);
  });
  it('does not allow a regular member to publish resources', () => {
    expect(canAccessModule(modules.resources,'member')).toBe(true);
    expect(canWriteModule(modules.resources,'member')).toBe(false);
  });
});
