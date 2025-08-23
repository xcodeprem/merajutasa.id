// Simple in-memory token manager with optional session persistence and refresh stub
let accessToken = null;
let accessTokenExpiry = null; // epoch ms

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn({ accessToken, accessTokenExpiry });
    } catch {
      void 0; // noop
    }
  });
}

export function setAccessToken(token, { ttlMs, expiresAt } = {}) {
  accessToken = token || null;
  if (expiresAt) accessTokenExpiry = expiresAt;
  else if (ttlMs) accessTokenExpiry = Date.now() + ttlMs;
  else accessTokenExpiry = null;

  // Optional: persist only for this session if flag enabled
  try {
    if (sessionStorage.getItem('equity_ui_remember_session_token') === '1') {
      sessionStorage.setItem('equity_ui_session_token', token || '');
      sessionStorage.setItem(
        'equity_ui_session_token_exp',
        accessTokenExpiry ? String(accessTokenExpiry) : ''
      );
    }
  } catch {
    void 0; // storage unavailable
  }
  notify();
}

export function getAccessToken() {
  if (!accessToken && typeof sessionStorage !== 'undefined') {
    try {
      const remembered = sessionStorage.getItem('equity_ui_session_token') || '';
      const exp = sessionStorage.getItem('equity_ui_session_token_exp');
      if (remembered) {
        accessToken = remembered;
        accessTokenExpiry = exp ? Number(exp) : null;
      }
    } catch {
      void 0; // ignore
    }
  }
  if (accessToken && accessTokenExpiry && Date.now() > accessTokenExpiry) {
    // Expired; clear
    accessToken = null;
    accessTokenExpiry = null;
  }
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  accessTokenExpiry = null;
  try {
    sessionStorage.removeItem('equity_ui_session_token');
    sessionStorage.removeItem('equity_ui_session_token_exp');
  } catch {
    void 0; // ignore
  }
  notify();
}

export function rememberInSession(enable) {
  try {
    sessionStorage.setItem('equity_ui_remember_session_token', enable ? '1' : '0');
    if (!enable) {
      sessionStorage.removeItem('equity_ui_session_token');
      sessionStorage.removeItem('equity_ui_session_token_exp');
    }
  } catch {
    void 0; // ignore
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// API Key helpers (less sensitive, allow localStorage persistence)
export function setApiKey(key) {
  try {
    if (key) localStorage.setItem('equity_ui_api_key', key);
    else localStorage.removeItem('equity_ui_api_key');
  } catch {
    void 0; // ignore
  }
}

export function getApiKey() {
  try {
    return localStorage.getItem('equity_ui_api_key');
  } catch {
    return null;
  }
}

// Refresh token stub: integrate with backend if available
export async function refreshAccessToken() {
  // Placeholder: implement call to refresh endpoint if provided
  // For now, no-op; return current token
  return getAccessToken();
}
