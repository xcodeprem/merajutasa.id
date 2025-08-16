#!/usr/bin/env node
/**
 * equity.js
 * H1-B1/B3: Minimal service to expose under-served and anomaly data for UI.
 * Endpoints:
 *  - GET /health -> { ok: true }
 *  - GET /under-served -> contents of artifacts/under-served.json
 *  - GET /equity/anomalies -> contents of artifacts/equity-anomalies.json
 *  - GET /equity/summary -> contents of artifacts/equity-summary.json
 *  - GET /kpi/h1 -> contents of artifacts/h1-kpi-summary.json
 *  - GET /kpi/weekly -> contents of artifacts/weekly-trends.json
 *  - GET /feedback/monthly -> contents of artifacts/feedback-monthly-rollup.json
 *  - GET /revocations -> [] (placeholder, mirrors revocation service contract)
 */
import http from 'http';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import path from 'path';

const PORT = Number(process.env.EQUITY_PORT || 4620);

// Absolute path to the UI root directory
const UI_ROOT = path.resolve('public/equity-ui');

async function readJson(path){
  try { return JSON.parse(await fs.readFile(path,'utf8')); }
  catch { return null; }
}

async function start(){
  const server = http.createServer(async (req,res)=>{
    try {
      // Static UI routes
      if (req.method==='GET' && (req.url==='/' || req.url==='/ui' || req.url==='/ui/')){
        const p = path.resolve('public/equity-ui/index.html');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        return createReadStream(p).pipe(res);
      }
      if (req.method==='GET' && req.url==='/ui/methodology'){
        const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Methodology</title></head><body style="font-family:system-ui,Arial,sans-serif;margin:20px"><h2>Hysteresis Methodology (Option F)</h2><p>States: NONE → CANDIDATE → ACTIVE → CLEARED with thresholds per DEC. Under-served includes ACTIVE or STALLED. Cooldown prevents immediate re-entry; severe ratio allows bypass.</p><p>See docs: <code>docs/fairness/hysteresis-public-methodology-fragment-v1.md</code></p></body></html>`;
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
      if (req.method==='GET' && req.url==='/ui/privacy-faq'){
        const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Privacy FAQ</title></head><body style="font-family:system-ui,Arial,sans-serif;margin:20px"><h2>Privacy FAQ (Abridged)</h2><ul><li>Kami tidak menyimpan PII anak/pengasuh.</li><li>Masukan (feedback) disaring otomatis (mask/redact) untuk data sensitif.</li><li>Salt rotasi harian: planned (H1-E1).</li></ul><p>Lihat: <code>docs/privacy/pii-pattern-library-v1.md</code> untuk pola yang didukung.</p></body></html>`;
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
      if (req.method==='GET' && req.url.startsWith('/ui/')){
        // Sanitize user-provided path strictly before resolving
        let file;
        try {
          file = decodeURIComponent(req.url.replace('/ui/',''));
        } catch {
          res.writeHead(400); return res.end();
        }
        // Reject absolute paths, backslashes, parent traversal, or suspicious chars
        if (file.startsWith('/') || file.includes('..') || file.includes('\\') || /[\0]/.test(file)){
          res.writeHead(400); return res.end();
        }
        // Allowlist conservative charset for segments
        const SAFE_RE = /^[a-zA-Z0-9._\/-]+$/;
        if (!SAFE_RE.test(file)) { res.writeHead(400); return res.end(); }
        // Extension whitelist and content types
        const ext = path.extname(file).toLowerCase();
        const types = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.ico': 'image/x-icon',
          '.map': 'application/json',
          '.json': 'application/json',
          '.txt': 'text/plain'
        };
        if (!types[ext]) { res.writeHead(415); return res.end(); }
        const p = path.resolve(UI_ROOT, file);
        let realPath;
        try {
          realPath = await fs.realpath(p);
        } catch (e) {
          res.writeHead(404);
          return res.end();
        }
        // Ensure the resolved path is within the UI root directory
        if (!realPath.startsWith(UI_ROOT + path.sep)) {
          res.writeHead(403);
          return res.end();
        }
  const type = types[ext] || 'application/octet-stream';
        res.writeHead(200, { 'content-type': type });
        return createReadStream(realPath).pipe(res);
      }
      if (req.method==='GET' && req.url==='/health'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ ok:true }));
      }
      if (req.method==='GET' && req.url==='/under-served'){
        const data = await readJson('artifacts/under-served.json');
        if (!data){ res.writeHead(404); return res.end(); }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(data));
      }
      if (req.method==='GET' && req.url==='/equity/anomalies'){
        const data = await readJson('artifacts/equity-anomalies.json');
        if (!data){ res.writeHead(404); return res.end(); }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(data));
      }
      if (req.method==='GET' && req.url==='/equity/summary'){
        const data = await readJson('artifacts/equity-summary.json');
        if (!data){ res.writeHead(404); return res.end(); }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(data));
      }
      if (req.method==='GET' && req.url==='/kpi/h1'){
        const data = await readJson('artifacts/h1-kpi-summary.json');
        if (!data){ res.writeHead(404); return res.end(); }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(data));
      }
      if (req.method==='GET' && req.url==='/kpi/weekly'){
        const data = await readJson('artifacts/weekly-trends.json');
        if (!data){ res.writeHead(404); return res.end(); }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(data));
      }
      if (req.method==='GET' && req.url==='/feedback/monthly'){
        const data = await readJson('artifacts/feedback-monthly-rollup.json');
        if (!data){ res.writeHead(404); return res.end(); }
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify(data));
      }
      if (req.method==='GET' && req.url==='/revocations'){
        // Placeholder: serve empty list or pass-through artifact if later added
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify([]));
      }
      res.writeHead(404); res.end();
    } catch(e){
      res.writeHead(500,{ 'content-type':'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
  server.listen(PORT, ()=> console.log(`[equity] listening on ${PORT}`));
}

start().catch(e=>{ console.error('[equity] fatal', e); process.exit(2); });
