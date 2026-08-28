import { describe, expect, it } from 'vitest';
import { resolveProtectedRoute } from '../src/auth/ProtectedRoute.jsx';

const ready = { loading:false, configured:true, user:{id:'user-1'}, profile:{onboarding_completed:true}, activeMembership:{id:'member-1'}, role:'member' };

describe('protected application routes', () => {
  it('requires a verified session', () => {
    expect(resolveProtectedRoute({...ready,user:null})).toBe('sign-in');
  });
  it('requires completed organization onboarding', () => {
    expect(resolveProtectedRoute({...ready,activeMembership:null})).toBe('onboarding');
  });
  it('enforces optional role gates', () => {
    expect(resolveProtectedRoute(ready,['owner','admin'])).toBe('denied');
    expect(resolveProtectedRoute({...ready,role:'owner'},['owner','admin'])).toBe('allow');
  });
  it('fails closed when the dedicated data service is absent', () => {
    expect(resolveProtectedRoute({...ready,configured:false})).toBe('setup');
  });
});
