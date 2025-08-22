#!/usr/bin/env node
/**
 * dev-kms-mock.js
 * Minimal local KMS mock to support envelope encryption demos and tests.
 * - Generates/stores a local KEK (AES-256-GCM key material) in artifacts/dev-kek.json
 * - Provides wrapKey/unlockKey for DEKs; uses AES-256-GCM with random IV; stores auth tag.
 * - Deterministic JSON outputs using tools/lib/json-stable.js
 */
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { stableStringify } from './lib/json-stable.js';

const ART_DIR = 'artifacts';
const KEK_PATH = path.join(ART_DIR, 'dev-kek.json');

function toBase64(buf){ return Buffer.from(buf).toString('base64'); }
function fromBase64(b64){ return Buffer.from(b64, 'base64'); }

function randomBytes(n=32){ return crypto.randomBytes(n); }

async function ensureDir(){ await fs.mkdir(ART_DIR, { recursive: true }); }

async function loadOrCreateKEK(){
  await ensureDir();
  try{
    const raw = await fs.readFile(KEK_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.kek && parsed.kek.length === 44){ // 32 bytes base64
      return parsed;
    }
  }catch{}
  const id = 'kek-' + crypto.randomUUID();
  const key = randomBytes(32);
  const kek = { id, alg: 'AES-256-GCM', created_utc: new Date().toISOString(), kek: toBase64(key) };
  await fs.writeFile(KEK_PATH, stableStringify(kek));
  return kek;
}

export async function getKEK(){ return loadOrCreateKEK(); }

export async function rotateKEK(){
  const id = 'kek-' + crypto.randomUUID();
  const key = randomBytes(32);
  const kek = { id, alg: 'AES-256-GCM', created_utc: new Date().toISOString(), kek: toBase64(key) };
  await ensureDir();
  await fs.writeFile(KEK_PATH, stableStringify(kek));
  return kek;
}

export function wrapDEK(plainDEK, kekB64){
  const kek = fromBase64(kekB64);
  const iv = randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  const ct = Buffer.concat([cipher.update(plainDEK), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: toBase64(iv), tag: toBase64(tag), wrapped: toBase64(ct), alg: 'AES-256-GCM' };
}

export function unwrapDEK(wrapped, kekB64){
  const kek = fromBase64(kekB64);
  const iv = fromBase64(wrapped.iv);
  const tag = fromBase64(wrapped.tag);
  const ct = fromBase64(wrapped.wrapped);
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt; // Buffer
}

export function encrypt(plainBuf, dekBuf){
  const iv = randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dekBuf, iv);
  const ct = Buffer.concat([cipher.update(plainBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: toBase64(iv), tag: toBase64(tag), ciphertext: toBase64(ct), alg: 'AES-256-GCM' };
}

export function decrypt(cipherObj, dekBuf){
  const iv = fromBase64(cipherObj.iv);
  const tag = fromBase64(cipherObj.tag);
  const ct = fromBase64(cipherObj.ciphertext);
  const decipher = crypto.createDecipheriv('aes-256-gcm', dekBuf, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt;
}

if (import.meta.main){
  const cmd = process.argv[2] || 'status';
  const kek = await loadOrCreateKEK();
  if (cmd === 'rotate'){ await rotateKEK(); console.log('KEK rotated:', kek.id); }
  else { console.log(stableStringify({ status:'READY', kek_id: kek.id, alg: kek.alg })); }
}
