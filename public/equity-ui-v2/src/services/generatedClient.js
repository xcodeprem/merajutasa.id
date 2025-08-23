// AUTO-GENERATED FILE. Do not edit manually.
// Generated from docs/api/openapi.json
import axios from 'axios';

export function createApiClient({ baseURL, getToken, getApiKey, onError } = {}) {
  const instance = axios.create({
    baseURL:
      baseURL ||
      (typeof window !== 'undefined'
        ? window.__GATEWAY_BASE_URL__ || 'http://localhost:8080'
        : 'http://localhost:8080'),
  });

  instance.interceptors.request.use((config) => {
    try {
      const token = getToken
        ? getToken()
        : typeof localStorage !== 'undefined'
          ? localStorage.getItem('equity_ui_token')
          : null;
      if (token) config.headers = { ...(config.headers || {}), Authorization: 'Bearer ' + token };
      const apiKey = getApiKey
        ? getApiKey()
        : typeof localStorage !== 'undefined'
          ? localStorage.getItem('equity_ui_api_key')
          : null;
      if (apiKey) config.headers = { ...(config.headers || {}), 'X-API-Key': apiKey };
    } catch { /* empty */ }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      const normalized = {
        message: err?.response?.data?.error || err.message || 'Request failed',
        status: err?.response?.status,
        requestId: err?.response?.headers?.['x-request-id'],
        timestamp: new Date().toISOString(),
        url: err?.config?.url,
        method: err?.config?.method,
      };
      if (onError) onError(normalized);
      return Promise.reject(Object.assign(err, { normalized }));
    }
  );

  return {
    async getApiV1SignerPubkey(config = {}) {
      const res = await instance.get(`/api/v1/signer/pubkey`, config);
      return res.data;
    },

    async postApiV1SignerSign(body, config = {}) {
      const res = await instance.post(`/api/v1/signer/sign`, body, config);
      return res.data;
    },

    async postApiV1ChainAppend(body, config = {}) {
      const res = await instance.post(`/api/v1/chain/append`, body, config);
      return res.data;
    },

    async getApiV1ChainHead(config = {}) {
      const res = await instance.get(`/api/v1/chain/head`, config);
      return res.data;
    },

    async postApiV1CollectorIngest(body, config = {}) {
      const res = await instance.post(`/api/v1/collector/ingest`, body, config);
      return res.data;
    },

    async getHealth(config = {}) {
      const res = await instance.get(`/health`, config);
      return res.data;
    },

    async getMetrics(config = {}) {
      const res = await instance.get(`/metrics`, config);
      return res.data;
    },

    async getServices(config = {}) {
      const res = await instance.get(`/services`, config);
      return res.data;
    },
  };
}

export const endpoints = [
  {
    path: '/api/v1/signer/pubkey',
    method: 'get',
    func: 'getApiV1SignerPubkey',
    summary: 'Get signer public key',
  },
  {
    path: '/api/v1/signer/sign',
    method: 'post',
    func: 'postApiV1SignerSign',
    summary: 'Sign a payload',
  },
  {
    path: '/api/v1/chain/append',
    method: 'post',
    func: 'postApiV1ChainAppend',
    summary: 'Append to integrity chain',
  },
  {
    path: '/api/v1/chain/head',
    method: 'get',
    func: 'getApiV1ChainHead',
    summary: 'Get chain head',
  },
  {
    path: '/api/v1/collector/ingest',
    method: 'post',
    func: 'postApiV1CollectorIngest',
    summary: 'Ingest event data',
  },
  {
    path: '/health',
    method: 'get',
    func: 'getHealth',
    summary: 'Gateway health check',
  },
  {
    path: '/metrics',
    method: 'get',
    func: 'getMetrics',
    summary: 'Gateway metrics',
  },
  {
    path: '/services',
    method: 'get',
    func: 'getServices',
    summary: 'List available services',
  },
];
