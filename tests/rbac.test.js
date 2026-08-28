import { describe, expect, it } from 'vitest';
import { hasPermission, roles } from '../services/api/src/rbac.js';

describe('server authoritative RBAC', () => {
  it('defines every IWW role', () => {
    expect(Object.keys(roles)).toEqual(expect.arrayContaining(['owner','admin','operations_manager','advisor','practitioner','member','family_delegate']));
  });
  it('does not allow member administration or integration permissions', () => {
    expect(hasPermission('member','team.manage')).toBe(false);
    expect(hasPermission('member','integration.manage')).toBe(false);
  });
  it('keeps family delegates narrowly scoped', () => {
    expect(hasPermission('family_delegate','delegated.read')).toBe(true);
    expect(hasPermission('family_delegate','member.read')).toBe(true);
    expect(hasPermission('family_delegate','report.view')).toBe(false);
    expect(hasPermission('family_delegate','audit.view')).toBe(false);
  });
  it('allows only operational roles to manage programmes', () => {
    expect(hasPermission('owner','programme.manage')).toBe(true);
    expect(hasPermission('operations_manager','programme.manage')).toBe(true);
    expect(hasPermission('advisor','programme.manage')).toBe(false);
  });
});
