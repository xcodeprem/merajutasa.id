# Security Guidelines

This document outlines security patterns and best practices for the MerajutASA project to prevent security vulnerabilities and maintain CodeQL compliance.

## Risky Security Patterns

The following patterns have been identified as potential security risks and are monitored by our automated security smoke tests.

### 1. Shell Command Injection

#### execSync with String Interpolation

**Risk Level:** HIGH

**Pattern:** Using `execSync()` with template literals or string interpolation
```javascript
// ❌ RISKY - Shell injection vulnerability
const result = execSync(`git log -1 --format=%cI -- "${userFile}"`);
```

**Safe Alternatives:**
```javascript
// ✅ SAFE - Use execFileSync with array arguments
import { execFileSync } from 'child_process';
const result = execFileSync('git', ['log', '-1', '--format=%cI', '--', userFile]);

// ✅ SAFE - Fixed strings without user input
const result = execSync('git log -1 --format=%H');
```

**Why it's risky:** Template literals with user input can allow shell command injection attacks where malicious input can execute unintended commands.

### 2. Path Traversal

#### path.resolve with User Input

**Risk Level:** HIGH

**Pattern:** Using `path.resolve()` directly with user-provided input
```javascript
// ❌ RISKY - Directory traversal vulnerability
const filePath = path.resolve(process.argv[2]);
```

**Safe Alternatives:**
```javascript
// ✅ SAFE - Validate input path
const userPath = process.argv[2];
if (userPath && !userPath.includes('..') && userPath.startsWith('/safe/dir/')) {
  const filePath = path.resolve(userPath);
}

// ✅ SAFE - Use path.join with base directory restriction
const basePath = '/safe/workspace/';
const filePath = path.join(basePath, path.basename(process.argv[2]));
```

**Why it's risky:** User input containing `../` sequences can traverse outside intended directories, potentially accessing sensitive files.

### 3. HTML Content Processing

#### Incomplete HTML Sanitization

**Risk Level:** MEDIUM

**Pattern:** Using simple regex to strip HTML tags
```javascript
// ❌ RISKY - Incomplete sanitization
const clean = dirty.replace(/<[^>]+>/g, '');
```

**Safe Alternatives:**
```javascript
// ✅ SAFE - Character-based replacement for known safe contexts
const clean = content.replace(/[<>]/g, ' ').trim();

// ✅ SAFE - Use proper HTML sanitization library
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

**Why it's risky:** Simple regex patterns can be bypassed with malformed HTML, potentially allowing XSS attacks.

## Security Testing

### Automated Security Smoke Tests

Run security pattern detection:
```bash
node tools/tests/security-patterns-smoke.js
```

This test scans all JavaScript files in the `tools/` directory for the risky patterns described above.

### Integration with CI

Security patterns are automatically checked as part of the governance verification process:
```bash
npm run governance:verify
```

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Send details to the project maintainers privately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Security Review Checklist

When adding new code that involves:

- [ ] Command execution (`exec*`, `spawn`)
- [ ] File path operations with user input
- [ ] HTML/text processing
- [ ] External API calls
- [ ] User input validation

Ensure:

- [ ] Input validation is performed
- [ ] Safe APIs are used (e.g., `execFileSync` vs `execSync`)
- [ ] Path traversal is prevented
- [ ] Proper sanitization is applied
- [ ] Security tests cover the new functionality

## References

- [OWASP Command Injection Prevention](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [CodeQL Security Rules](https://codeql.github.com/codeql-query-help/javascript/)