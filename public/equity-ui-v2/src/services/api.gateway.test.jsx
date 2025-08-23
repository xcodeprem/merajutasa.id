import { describe, it, expect, vi } from 'vitest';
import { apiGateway } from './api';

vi.mock('./generatedClient', async () => {
  const actual = await vi.importActual('./generatedClient');
  return {
    ...actual,
    createApiClient: () => ({
      getHealth: vi.fn(async () => ({ status: 'healthy' })),
      getServices: vi.fn(async () => ({ services: [] })),
      getApiV1ChainHead: vi.fn(async () => ({ height: 1 })),
      postApiV1ChainAppend: vi.fn(async (b) => ({ ok: true, ...b })),
      getApiV1SignerPubkey: vi.fn(async () => ({ publicKeyPem: 'PEM' })),
      postApiV1SignerSign: vi.fn(async () => ({ signature: 'sig' })),
      postApiV1CollectorIngest: vi.fn(async () => ({ status: 'accepted' })),
    }),
  };
});

describe('API Gateway client integration', () => {
  it('health passes', async () => {
    const h = await apiGateway.getHealth();
    expect(h.status).toBe('healthy');
  });
  it('services returns array', async () => {
    const s = await apiGateway.getServices();
    expect(s).toHaveProperty('services');
    expect(Array.isArray(s.services)).toBe(true);
  });
});
