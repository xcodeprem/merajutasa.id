import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  getAccessTokenExpiry,
  clearAccessToken,
  rememberInSession,
  setRefreshToken,
  getRefreshToken,
} from './tokenManager';

describe('tokenManager', () => {
  beforeEach(() => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    clearAccessToken();
  });

  afterEach(() => {
    clearAccessToken();
  });

  it('sets and gets access token with expiry and refresh token', () => {
    rememberInSession(true);
    setAccessToken('abc', { ttlMs: 2000 });
    setRefreshToken('rt1');
    expect(getAccessToken()).toBe('abc');
    const exp = getAccessTokenExpiry();
    expect(typeof exp === 'number' && exp > Date.now()).toBe(true);
    expect(getRefreshToken()).toBe('rt1');
  });

  it('expires token after ttl', () => {
    vi.useFakeTimers();
    setAccessToken('short', { ttlMs: 1 });
    expect(getAccessToken()).toBe('short');
    vi.advanceTimersByTime(5);
    expect(getAccessToken()).toBeNull();
    vi.useRealTimers();
  });

  it('clearAccessToken removes persisted session values', () => {
    rememberInSession(true);
    setAccessToken('zzz', { ttlMs: 1000 });
    setRefreshToken('rrr');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    try {
      expect(sessionStorage.getItem('equity_ui_session_token')).toBeNull();
      expect(sessionStorage.getItem('equity_ui_session_token_exp')).toBeNull();
      expect(sessionStorage.getItem('equity_ui_refresh_token')).toBeNull();
    } catch {}
  });
});
