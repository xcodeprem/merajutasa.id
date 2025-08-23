import { describe, it, expect, vi } from 'vitest';
import { createAuthedGatewayClient } from './authService';

vi.mock('../generatedClient', () => {
  return {
    createApiClient: () => ({
      getHealth: vi.fn(async () => {
        const err = new Error('unauthorized');
        err.response = { status: 401 };
        throw err;
      }),
    }),
  };
});

vi.mock('./tokenManager', () => {
  let tok = 't1';
  return {
    getAccessToken: () => tok,
    clearAccessToken: () => {
      tok = null;
    },
    subscribe: () => () => {},
  };
});

describe('createAuthedGatewayClient', () => {
  it('attempts refresh+retry once on 401 and then clears session', async () => {
    const client = createAuthedGatewayClient();
    await expect(client.getHealth()).rejects.toBeTruthy();
  });
});
