#!/usr/bin/env node
/**
 * signer-enhanced.js
 * Enhanced signer service with integrated security, monitoring, and logging
 * Preserves original functionality while adding production-ready infrastructure layers
 */

import http from 'http';
import { promises as fs } from 'fs';
import { generateKeyPairSync } from 'crypto';
import crypto from 'crypto';
import { createAuthMiddleware } from '../infrastructure/auth/auth-middleware.js';
import { createValidationMiddleware, createGeneralValidationMiddleware } from '../infrastructure/security/input-validator.js';
import { createRateLimitMiddleware } from '../infrastructure/security/rate-limiter.js';
import { createMetricsMiddleware, trackSigningOperation } from '../infrastructure/monitoring/metrics-collector.js';
import { logger, createLoggingMiddleware } from '../infrastructure/monitoring/structured-logger.js';

const PORT = process.env.SIGNER_PORT || 4601;
const KEY_DIR = '.integrity';
const KEYS_STATE = `${KEY_DIR}/keys.json`;

// Original stable stringify functions (preserved exactly)
function stableStringify(obj){
  if (typeof obj === 'string') return obj;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k=>`"${k}":${stableSerialize(obj[k])}`).join(',') + '}';
}

function stableSerialize(v){
  if (v === null) return 'null';
  if (Array.isArray(v)) return '['+v.map(stableSerialize).join(',')+']';
  switch(typeof v){
    case 'string': return JSON.stringify(v);
    case 'number': return Number.isFinite(v)? String(v):'null';
    case 'boolean': return v?'true':'false';
    case 'object': return stableStringify(v);
    default: return 'null';
  }
}

// Original key management functions (preserved exactly)
async function ensureKeys(){
  await fs.mkdir(KEY_DIR,{recursive:true});
  let state = null;
  try { state = JSON.parse(await fs.readFile(KEYS_STATE,'utf8')); } catch { /* no-op */ }
  if (!state || !Array.isArray(state.keys) || typeof state.activeIndex !== 'number'){
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    state = { activeIndex: 0, keys: [
      {
        id: `k-${Date.now()}`,
        privPem: privateKey.export({type:'pkcs8',format:'pem'}),
        pubPem: publicKey.export({type:'spki',format:'pem'})
      }
    ]};
    await fs.writeFile(KEYS_STATE, JSON.stringify(state,null,2));
  }
  return state;
}

async function signPayload(payload, privPem) {
  const canonical = stableStringify(payload);
  const hash_sha256 = crypto.createHash('sha256').update(canonical).digest('hex');
  const privateKey = crypto.createPrivateKey(privPem);
  const signature = crypto.sign(null, Buffer.from(canonical), privateKey).toString('base64');
  return { canonical, hash_sha256, signature, alg: 'Ed25519' };
}

// Enhanced middleware stack
const authMiddleware = createAuthMiddleware({
  requireAuth: true,
  allowedRoles: ['admin', 'operator'],
  bypassPaths: ['/health', '/pubkey']
});

const validationMiddleware = createGeneralValidationMiddleware();
const signValidationMiddleware = createValidationMiddleware('/api/signer/sign');
const rateLimitMiddleware = createRateLimitMiddleware('/api/signer');
const metricsMiddleware = createMetricsMiddleware('signer');
const loggingMiddleware = createLoggingMiddleware(logger);

// Enhanced request handler with middleware integration
async function handleRequest(req, res) {
  // Apply middleware stack
  try {
    await new Promise((resolve, reject) => {
      loggingMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      metricsMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      validationMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      rateLimitMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Skip auth for public endpoints
    if (req.url !== '/pubkey' && req.url !== '/health') {
      await new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Apply endpoint-specific validation for signing
    if (req.url === '/sign' && req.method === 'POST') {
      await new Promise((resolve, reject) => {
        signValidationMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

  } catch (middlewareError) {
    // Middleware already handled the response
    return;
  }

  // Original signer logic (preserved exactly)
  const state = await ensureKeys();
  const activeKey = state.keys[state.activeIndex];

  if (req.method === 'GET' && req.url === '/pubkey') {
    await logger.info('Public key requested', { 
      requestId: req.requestId,
      keyId: activeKey.id 
    });
    
    trackSigningOperation('pubkey_request', 'success');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ publicKeyPem: activeKey.pubPem }));
    return;
  }

  if (req.method === 'POST' && req.url === '/sign') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { payload } = JSON.parse(body);
        
        await logger.audit('Signature operation initiated', {
          requestId: req.requestId,
          user: req.user?.id,
          keyId: activeKey.id,
          payloadHash: crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
        });

        const result = await signPayload(payload, activeKey.privPem);
        
        trackSigningOperation('sign', 'success');
        
        await logger.info('Signature operation completed', {
          requestId: req.requestId,
          signatureHash: crypto.createHash('sha256').update(result.signature).digest('hex')
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        trackSigningOperation('sign', 'error');
        
        await logger.error('Signature operation failed', {
          requestId: req.requestId,
          error: error.message
        }, error);

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/verify') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { canonical, signature, publicKeyPem } = JSON.parse(body);
        const publicKey = crypto.createPublicKey(publicKeyPem || activeKey.pubPem);
        const verified = crypto.verify(null, Buffer.from(canonical), publicKey, Buffer.from(signature, 'base64'));
        
        trackSigningOperation('verify', verified ? 'success' : 'failed');
        
        await logger.info('Signature verification completed', {
          requestId: req.requestId,
          verified: verified
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ verified }));
      } catch (error) {
        trackSigningOperation('verify', 'error');
        
        await logger.error('Signature verification failed', {
          requestId: req.requestId,
          error: error.message
        }, error);

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid verification request' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/rotate') {
    try {
      const { publicKey, privateKey } = generateKeyPairSync('ed25519');
      const newKey = {
        id: `k-${Date.now()}`,
        privPem: privateKey.export({type:'pkcs8',format:'pem'}),
        pubPem: publicKey.export({type:'spki',format:'pem'})
      };
      
      state.keys.push(newKey);
      state.activeIndex = state.keys.length - 1;
      await fs.writeFile(KEYS_STATE, JSON.stringify(state, null, 2));

      trackSigningOperation('rotate', 'success');
      
      await logger.audit('Key rotation completed', {
        requestId: req.requestId,
        user: req.user?.id,
        oldKeyId: activeKey.id,
        newKeyId: newKey.id
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        rotated: true, 
        newKeyId: newKey.id,
        publicKeyPem: newKey.pubPem 
      }));
    } catch (error) {
      trackSigningOperation('rotate', 'error');
      
      await logger.error('Key rotation failed', {
        requestId: req.requestId,
        error: error.message
      }, error);

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Key rotation failed' }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      service: 'signer',
      timestamp: new Date().toISOString(),
      activeKeyId: activeKey.id,
      version: '1.1.0-enhanced'
    }));
    return;
  }

  // 404 for unknown endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Enhanced HTTP server with proper error handling
const server = http.createServer((req, res) => {
  // Parse request body for POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (body) {
          req.body = JSON.parse(body);
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      
      handleRequest(req, res).catch(error => {
        logger.error('Request handling error', { error: error.message }, error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    });
  } else {
    handleRequest(req, res).catch(error => {
      logger.error('Request handling error', { error: error.message }, error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  }
});

// Start server
server.listen(PORT, '127.0.0.1', async () => {
  await logger.info('Enhanced signer service started', {
    port: PORT,
    version: '1.1.0-enhanced',
    features: ['auth', 'validation', 'rate-limiting', 'metrics', 'logging']
  });
  
  console.log(`🔐 Enhanced signer service listening on port ${PORT}`);
  console.log(`🛡️  Security: Authentication, validation, rate limiting enabled`);
  console.log(`📊 Monitoring: Metrics and structured logging enabled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await logger.info('Signer service shutting down');
  server.close(() => {
    process.exit(0);
  });
});

export { server, handleRequest };