import fs from 'fs/promises';
import path from 'path';

const SPEC_PATH = path.resolve('docs/api/openapi.json');
const OUTPUT_DIR = path.resolve('public/equity-ui-v2/src/services');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'generatedClient.js');
const ARTIFACT = path.resolve('artifacts/api-client-generate-log.json');

function toFuncName(method, p) {
  const clean = p.replace(/^\//, '').replace(/\{([^}]+)\}/g, 'By_$1').replace(/[^a-zA-Z0-9]+/g, '_');
  const m = method.toLowerCase();
  const core = clean.split('_').map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))).join('');
  return `${m}${core.charAt(0).toUpperCase()}${core.slice(1)}`;
}

function buildClientSource(endpoints) {
  const methodsSrc = endpoints.map(ep => {
    const hasBody = ep.method === 'post' || ep.method === 'put' || ep.method === 'patch';
    const args = [];
    if (ep.path.includes('{')) args.push('pathParams = {}');
    if (hasBody) args.push('body');
    args.push('config = {}');

    // Build path interpolation
    let pathExpr = '`' + ep.path.replace(/\{([^}]+)\}/g, '${pathParams.$1}') + '`';
    const axiosCall = ep.method === 'get' || ep.method === 'delete'
      ? `instance.${ep.method}(${pathExpr}, config)`
      : `instance.${ep.method}(${pathExpr}, body, config)`;

    return `  async ${ep.func}(${args.join(', ')}) {
    const res = await ${axiosCall};
    return res.data;
  }`;
  }).join(',\n\n');

  return `// AUTO-GENERATED FILE. Do not edit manually.
// Generated from docs/api/openapi.json
import axios from 'axios';

export function createApiClient({ baseURL, getToken, getApiKey, onError } = {}) {
  const instance = axios.create({ baseURL: baseURL || (typeof window !== 'undefined' ? (window.__GATEWAY_BASE_URL__ || 'http://localhost:8080') : 'http://localhost:8080') });

  instance.interceptors.request.use((config) => {
    try {
  const token = getToken ? getToken() : null;
      if (token) config.headers = { ...(config.headers || {}), Authorization: 'Bearer ' + token };
  const apiKey = getApiKey ? getApiKey() : null;
      if (apiKey) config.headers = { ...(config.headers || {}), 'X-API-Key': apiKey };
    } catch {}
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
${methodsSrc}
  };
}

export const endpoints = ${JSON.stringify(endpoints, null, 2)};
`;
}

async function main() {
  const specRaw = await fs.readFile(SPEC_PATH, 'utf8');
  const spec = JSON.parse(specRaw);
  const endpoints = [];
  for (const [p, methods] of Object.entries(spec.paths || {})) {
    for (const [method, def] of Object.entries(methods)) {
      const func = toFuncName(method, p);
      endpoints.push({ path: p, method, func, summary: def.summary || '' });
    }
  }
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const src = buildClientSource(endpoints);
  await fs.writeFile(OUTPUT_FILE, src, 'utf8');
  const log = {
    generatedAt: new Date().toISOString(),
    specPath: SPEC_PATH,
    outputFile: OUTPUT_FILE,
    totalEndpoints: endpoints.length,
    endpoints,
  };
  await fs.mkdir(path.dirname(ARTIFACT), { recursive: true });
  await fs.writeFile(ARTIFACT, JSON.stringify(log, null, 2));
  console.log('Generated API client:', OUTPUT_FILE);
}

main().catch((e) => {
  console.error('Failed to generate client', e);
  process.exitCode = 1;
});
