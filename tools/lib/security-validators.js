'use strict';
import path from 'node:path';

/**
 * security-validators.js
 * Security validation utilities to prevent path traversal and other injection attacks
 */

/**
 * Convert user-provided path to safe child path within a base directory
 * @param {string} baseDir - The base directory (must be absolute)
 * @param {string} userPath - User-provided path (relative or absolute)
 * @returns {string} Safe absolute path within baseDir
 * @throws {Error} If path would escape baseDir or contains unsafe patterns
 */
export function toSafeChildPath(baseDir, userPath) {
  if (!baseDir || !userPath) {
    throw new Error('baseDir and userPath are required');
  }
  
  const normalizedBase = path.resolve(baseDir);
  
  // Reject absolute paths from user to prevent direct traversal
  if (path.isAbsolute(userPath)) {
    throw new Error(`Absolute paths not allowed: ${userPath}`);
  }
  
  // Check for obvious traversal patterns including encoded variants
  const suspiciousPatterns = [
    '..', '\\', '\0',
    '%2e', '%2f', '%5c',  // URL-encoded
    '%252e', '%252f', '%255c',  // Double URL-encoded
    '\u2024',  // Unicode homoglyph for period (․)
    '\u002e\u002e'  // Explicit Unicode dots
  ];
  
  const lowerPath = userPath.toLowerCase();
  for (const pattern of suspiciousPatterns) {
    if (lowerPath.includes(pattern.toLowerCase())) {
      throw new Error(`Path traversal detected: ${userPath}`);
    }
  }
  
  // Resolve the candidate path
  const candidate = path.resolve(normalizedBase, userPath);
  
  // Ensure the resolved path is still within baseDir
  // Ensure the resolved path is still within baseDir using path.relative
  const rel = path.relative(normalizedBase, candidate);
  if (rel === '' || (rel.split(path.sep)[0] !== '..' && !path.isAbsolute(rel))) {
    // OK
  } else {
    throw new Error(`Path escapes base directory: ${userPath}`);
  }
  
  return candidate;
}

/**
 * Validate file argument from CLI with base directory constraint
 * @param {string} baseDir - Base directory to constrain files to
 * @param {string} arg - CLI argument (file path)
 * @param {string} defaultFile - Default file if arg is empty
 * @returns {string} Safe absolute file path
 */
export function validateFileArg(baseDir, arg, defaultFile) {
  if (!arg) {
    return defaultFile ? path.resolve(baseDir, defaultFile) : null;
  }
  
  return toSafeChildPath(baseDir, arg);
}

/**
 * Validate DEC file path for phase tracker
 * @param {string} decPath - Path to DEC file
 * @returns {string} Validated DEC file path
 */
export function validateDecFile(decPath) {
  const BASE_DEC_DIR = path.resolve(process.cwd(), 'docs/governance/dec');
  
  if (!decPath) {
    throw new Error('DEC file path is required');
  }
  
  // If already absolute and within DEC directory, validate and return
  if (path.isAbsolute(decPath)) {
    const resolved = path.resolve(decPath);
    if (!resolved.startsWith(BASE_DEC_DIR + path.sep)) {
      throw new Error(`DEC file must be within docs/governance/dec: ${decPath}`);
    }
    return resolved;
  }
  
  // For relative paths, first check if it's already a full path from project root
  const fromRoot = path.resolve(process.cwd(), decPath);
  if (fromRoot.startsWith(BASE_DEC_DIR + path.sep)) {
    return fromRoot;
  }
  
  // Otherwise treat as relative to DEC directory
  return toSafeChildPath(BASE_DEC_DIR, decPath);
}