#!/usr/bin/env node
/**
 * auth-middleware.js
 * Authentication middleware for MerajutASA.id services
 * Implements JWT validation, API key authentication, and role-based access control
 * Based on OWASP authentication best practices
 */

import crypto from 'crypto';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

// Authentication configuration
const AUTH_CONFIG = {
  jwt: {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'merajutasa.id',
    audience: 'merajutasa-api',
  },
  apiKey: {
    headerName: 'X-API-Key',
    minLength: 32,
    hashAlgorithm: 'sha256',
  },
  session: {
    maxAge: 3600000, // 1 hour
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  },
};

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: ['signer:*', 'chain:*', 'collector:*', 'equity:*', 'revocation:*'],
  operator: ['signer:read', 'chain:read', 'chain:append', 'collector:ingest', 'equity:read'],
  auditor: ['signer:read', 'chain:read', 'collector:read', 'equity:read'],
  readonly: ['signer:read', 'chain:read', 'equity:read'],
};

// Service endpoint permissions mapping
const ENDPOINT_PERMISSIONS = {
  'GET:/api/signer/pubkey': 'signer:read',
  'POST:/api/signer/sign': 'signer:sign',
  'POST:/api/signer/rotate': 'signer:rotate',
  'GET:/api/chain/head': 'chain:read',
  'POST:/api/chain/append': 'chain:append',
  'GET:/api/chain/verify': 'chain:read',
  'POST:/api/collector/ingest': 'collector:ingest',
  'GET:/api/collector/metrics': 'collector:read',
  'GET:/api/equity/metrics': 'equity:read',
  'POST:/api/equity/snapshot': 'equity:write',
  'GET:/api/revocation/status': 'revocation:read',
  'POST:/api/revocation/revoke': 'revocation:revoke',
};

/**
 * Load authentication configuration from files
 */
async function loadAuthConfig() {
  try {
    const authDir = './infrastructure/auth';

    // Load JWT secret
    let jwtSecret;
    try {
      jwtSecret = await fs.readFile(`${authDir}/jwt-secret.key`, 'utf8');
    } catch {
      // Generate new secret if not exists
      jwtSecret = crypto.randomBytes(64).toString('hex');
      await fs.mkdir(authDir, { recursive: true });
      await fs.writeFile(`${authDir}/jwt-secret.key`, jwtSecret, { mode: 0o600 });
    }

    // Load API keys
    const apiKeys = new Map();
    try {
      const apiKeyData = await fs.readFile(`${authDir}/api-keys.json`, 'utf8');
      const keys = JSON.parse(apiKeyData);
      Object.entries(keys).forEach(([keyHash, metadata]) => {
        apiKeys.set(keyHash, metadata);
      });
    } catch {
      // Initialize with default admin key
      const adminKey = crypto.randomBytes(32).toString('hex');
      const keyHash = createHash('sha256').update(adminKey).digest('hex');
      apiKeys.set(keyHash, {
        name: 'default-admin',
        role: 'admin',
        created: new Date().toISOString(),
        lastUsed: null,
      });

      await fs.writeFile(`${authDir}/api-keys.json`, JSON.stringify({
        [keyHash]: apiKeys.get(keyHash),
      }, null, 2));

      await fs.writeFile(`${authDir}/admin-api-key.txt`, adminKey, { mode: 0o600 });
      console.log(`Generated admin API key: ${adminKey}`);
    }

    return { jwtSecret, apiKeys };
  } catch (error) {
    console.error('Failed to load auth config:', error);
    throw error;
  }
}

/**
 * Validate JWT token
 */
function validateJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {return null;}

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) {return null;}

    // Parse payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {return null;}

    // Check issuer and audience
    if (payload.iss !== AUTH_CONFIG.jwt.issuer) {return null;}
    if (payload.aud !== AUTH_CONFIG.jwt.audience) {return null;}

    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if user has required permission
 */
function hasPermission(userRole, requiredPermission) {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];

  return userPermissions.some(perm => {
    if (perm.endsWith(':*')) {
      const service = perm.split(':')[0];
      return requiredPermission.startsWith(`${service}:`);
    }
    return perm === requiredPermission;
  });
}

/**
 * Authentication middleware factory
 */
export function createAuthMiddleware(options = {}) {
  const {
    requireAuth = true,
    allowedRoles = null,
    bypassPaths = ['/health', '/metrics'],
  } = options;

  let authConfig = null;

  // Initialize auth config
  loadAuthConfig().then(config => {
    authConfig = config;
  }).catch(error => {
    console.error('Auth middleware initialization failed:', error);
    process.exit(1);
  });

  return async function authMiddleware(req, res, next) {
    try {
      // Skip auth for bypass paths
      if (bypassPaths.some(path => req.url.startsWith(path))) {
        return next();
      }

      // Wait for auth config to load
      if (!authConfig) {
        return res.status(503).json({
          error: 'Authentication service unavailable',
          code: 'AUTH_LOADING',
        });
      }

      // Skip if auth not required
      if (!requireAuth) {
        return next();
      }

      let user = null;

      // Try JWT authentication
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = validateJWT(token, authConfig.jwtSecret);
        if (payload) {
          user = {
            id: payload.sub,
            role: payload.role,
            type: 'jwt',
          };
        }
      }

      // Try API key authentication
      if (!user) {
        const apiKey = req.headers[AUTH_CONFIG.apiKey.headerName.toLowerCase()];
        if (apiKey && apiKey.length >= AUTH_CONFIG.apiKey.minLength) {
          const keyHash = createHash(AUTH_CONFIG.apiKey.hashAlgorithm)
            .update(apiKey)
            .digest('hex');

          const keyMetadata = authConfig.apiKeys.get(keyHash);
          if (keyMetadata) {
            user = {
              id: keyMetadata.name,
              role: keyMetadata.role,
              type: 'apikey',
            };

            // Update last used timestamp
            keyMetadata.lastUsed = new Date().toISOString();
          }
        }
      }

      // Authentication failed
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Valid JWT token or API key required',
        });
      }

      // Check role restrictions
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_ROLE',
          required: allowedRoles,
          actual: user.role,
        });
      }

      // Check endpoint-specific permissions
      const endpoint = `${req.method}:${req.url.split('?')[0]}`;
      const requiredPermission = ENDPOINT_PERMISSIONS[endpoint];

      if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSION',
          required: requiredPermission,
          endpoint,
        });
      }

      // Add user to request
      req.user = user;
      req.authType = user.type;

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR',
      });
    }
  };
}

/**
 * Generate JWT token for authenticated user
 */
export function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const jwtPayload = {
    ...payload,
    iss: AUTH_CONFIG.jwt.issuer,
    aud: AUTH_CONFIG.jwt.audience,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

/**
 * API key management utilities
 */
export class APIKeyManager {
  constructor(authConfig) {
    this.authConfig = authConfig;
  }

  async generateKey(name, role = 'readonly') {
    const key = crypto.randomBytes(32).toString('hex');
    const keyHash = createHash('sha256').update(key).digest('hex');

    const metadata = {
      name,
      role,
      created: new Date().toISOString(),
      lastUsed: null,
    };

    this.authConfig.apiKeys.set(keyHash, metadata);

    // Save to file
    const authDir = './infrastructure/auth';
    const keyData = Object.fromEntries(this.authConfig.apiKeys);
    await fs.writeFile(`${authDir}/api-keys.json`, JSON.stringify(keyData, null, 2));

    return { key, metadata };
  }

  async revokeKey(keyHash) {
    const deleted = this.authConfig.apiKeys.delete(keyHash);

    if (deleted) {
      // Save to file
      const authDir = './infrastructure/auth';
      const keyData = Object.fromEntries(this.authConfig.apiKeys);
      await fs.writeFile(`${authDir}/api-keys.json`, JSON.stringify(keyData, null, 2));
    }

    return deleted;
  }

  listKeys() {
    return Array.from(this.authConfig.apiKeys.entries()).map(([hash, metadata]) => ({
      hash: hash.substring(0, 8) + '...',
      ...metadata,
    }));
  }
}

export default createAuthMiddleware;
