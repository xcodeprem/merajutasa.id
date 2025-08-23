import { getAccessToken, clearAccessToken, subscribe } from './tokenManager';
import { createApiClient } from '../generatedClient';

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
      // If backend exposes refresh, call here. Placeholder fallback: no-op.
      const token = getAccessToken();
      if (!token) return null;
      // Example (disabled): await axios.post(`${gatewayBase}/auth/refresh`)
      return token;
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
