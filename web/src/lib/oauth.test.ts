import { describe, expect, it } from 'vitest';
import { isOAuthProvider, safeRedirect } from './oauth';

describe('isOAuthProvider', () => {
  it('accepts the providers we support', () => {
    expect(isOAuthProvider('google')).toBe(true);
    expect(isOAuthProvider('facebook')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isOAuthProvider('twitter')).toBe(false);
    expect(isOAuthProvider('Google')).toBe(false);
    expect(isOAuthProvider('')).toBe(false);
    expect(isOAuthProvider('../auth/login')).toBe(false);
  });
});

describe('safeRedirect', () => {
  it('keeps a same-site path', () => {
    expect(safeRedirect('/user/events')).toBe('/user/events');
    expect(safeRedirect('/dashboard/admin?tab=events')).toBe(
      '/dashboard/admin?tab=events',
    );
  });

  it('drops an empty value', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect('')).toBeNull();
  });

  // The value survives a round trip through the provider, so it has to be
  // treated as attacker-controlled: none of these may send a user off-site.
  it('drops anything that could leave the site', () => {
    expect(safeRedirect('//evil.com')).toBeNull();
    expect(safeRedirect('https://evil.com')).toBeNull();
    expect(safeRedirect('http://evil.com')).toBeNull();
    expect(safeRedirect('/\\evil.com')).toBeNull();
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
    expect(safeRedirect('user/events')).toBeNull();
  });
});
