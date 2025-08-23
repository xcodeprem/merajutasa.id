import {
  getAccessToken,
  getAccessTokenExpiry,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAccessToken,
  subscribe,
} from './tokenManager';
import { createApiClient } from '../generatedClient';
import axios from 'axios';

// Lightweight auth service: manages refresh and logout
const gatewayBase =
  typeof window !== 'undefined'
    ? window.__GATEWAY_BASE_URL__ || 'http://localhost:8080'
    : 'http://localhost:8080';

let lastRefreshAt = 0;
let refreshing = null;

export function getAuthState() {
  const token = getAccessToken();
  return { isAuthenticated: !!token, token };
}

export function onAuthChange(cb) {
  return subscribe(() => cb(getAuthState()));
}

export async function refreshToken() {
  if (refreshing) return refreshing;
  const now = Date.now();
  if (now - lastRefreshAt < 2000) return getAccessToken();
  lastRefreshAt = now;
  refreshing = (async () => {
    try {
      const rt = getRefreshToken();
      if (!rt) return null;
      const res = await axios.post(`${gatewayBase}/auth/refresh`, { refresh_token: rt });
      const { access_token, expires_in, refresh_token } = res.data || {};
      if (access_token) {
        const ttlMs = typeof expires_in === 'number' ? expires_in * 1000 : undefined;
        setAccessToken(access_token, ttlMs ? { ttlMs } : {});
        if (refresh_token) setRefreshToken(refresh_token);
        return access_token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export function logout() {
  clearAccessToken();
}

// Axios client wrapper with 401 auto-refresh+retry
export function createAuthedGatewayClient() {
  const client = createApiClient({
    baseURL: gatewayBase,
    getToken: () => getAccessToken(),
  });

  const wrap = async (fn, ...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      const status = err?.normalized?.status || err?.response?.status;
      if (status === 401) {
        const newTok = await refreshToken();
        if (newTok) {
          // Try once more
          return await fn(...args);
        }
        // give up and clear session
        logout();
      }
      throw err;
    }
  };

  return {
    getHealth: () => wrap(client.getHealth),
    getServices: () => wrap(client.getServices),
    getApiV1ChainHead: () => wrap(client.getApiV1ChainHead),
    postApiV1ChainAppend: (payload) => wrap(client.postApiV1ChainAppend, payload),
    getApiV1SignerPubkey: () => wrap(client.getApiV1SignerPubkey),
    postApiV1SignerSign: (body) => wrap(client.postApiV1SignerSign, body),
  };
}

// Silent refresh scheduler: triggers refresh ~60s before expiry when possible
let silentTimer = null;
export function startSilentRefresh() {
  stopSilentRefresh();
  const exp = getAccessTokenExpiry();
  const tok = getAccessToken();
  if (!tok || !exp) return;
  const lead = 60_000; // 60s early
  const delay = Math.max(0, exp - Date.now() - lead);
  silentTimer = setTimeout(() => {
    refreshToken().finally(() => startSilentRefresh());
  }, delay);
}

export function stopSilentRefresh() {
  if (silentTimer) {
    clearTimeout(silentTimer);
    silentTimer = null;
  }
}
