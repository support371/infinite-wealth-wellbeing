export function workspaceBase(organization) {
  return organization?.slug ? `/w/${encodeURIComponent(organization.slug)}` : '/workspaces';
}

export function workspacePath(organization, path = '') {
  const base = workspaceBase(organization);
  return path ? `${base}/${path.replace(/^\//, '')}` : base;
}
