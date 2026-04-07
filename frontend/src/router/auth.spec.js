import { describe, expect, it } from 'vitest';
import { getDefaultRouteForRole, resolveAuthNavigation } from './auth.js';

const makeRoute = (path, meta = {}) => ({ path, meta });

describe('router auth navigation', () => {
  it('redirects guests away from protected routes', () => {
    const result = resolveAuthNavigation(makeRoute('/user/dashboard', { requiresAuth: true }), {
      token: '',
      claims: {}
    });

    expect(result).toBe('/signin');
  });

  it('redirects authenticated guests away from guest-only routes', () => {
    const result = resolveAuthNavigation(makeRoute('/signin', { guestOnly: true }), {
      token: 'token',
      claims: { role: 'org_admin' }
    });

    expect(result).toBe('/org-admin/dashboard');
  });

  it('forces password reset when required', () => {
    const result = resolveAuthNavigation(makeRoute('/org-admin/users', { requiresOrgAdmin: true }), {
      token: 'token',
      claims: { role: 'org_admin', must_change_password: 1 }
    });

    expect(result).toBe('/change-password');
  });

  it('blocks super admin from org-admin routes', () => {
    const result = resolveAuthNavigation(makeRoute('/org-admin/dashboard', { requiresOrgAdmin: true }), {
      token: 'token',
      claims: { role: 'super_admin' }
    });

    expect(result).toBe('/admin/dashboard');
  });

  it('returns the correct default route for each role', () => {
    expect(getDefaultRouteForRole('super_admin')).toBe('/admin/dashboard');
    expect(getDefaultRouteForRole('org_admin')).toBe('/org-admin/dashboard');
    expect(getDefaultRouteForRole('user')).toBe('/user/dashboard');
  });
});
