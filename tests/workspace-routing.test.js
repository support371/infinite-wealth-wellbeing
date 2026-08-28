import { describe, expect, it } from 'vitest';
import { workspaceBase, workspacePath } from '../src/app/workspaceRoutes.js';

describe('tenant workspace routes', () => {
  const organization = { slug: 'gemassist-enterprise' };

  it('uses stable organization-slug routes', () => {
    expect(workspaceBase(organization)).toBe('/w/gemassist-enterprise');
    expect(workspacePath(organization, 'integrations')).toBe('/w/gemassist-enterprise/integrations');
  });

  it('fails back to authorized workspace selection when organization is absent', () => {
    expect(workspaceBase(null)).toBe('/workspaces');
  });
});
