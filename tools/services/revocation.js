#!/usr/bin/env node
/**
 * revocation.js
 * H1-I1: Minimal revocation endpoint service.
 * Endpoints:
 *  - GET /health -> { ok: true }
 *  - GET /revocations -> [] (JSON array per schema)
 */
import http from 'http';

const PORT = Number(process.env.REVOCATION_PORT || 4610);

async function start(){
  const server = http.createServer(async (req,res)=>{
    try {
      if (req.method==='GET' && req.url==='/health'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify({ ok:true }));
      }
      if (req.method==='GET' && req.url==='/revocations'){
        res.writeHead(200,{ 'content-type':'application/json' });
        return res.end(JSON.stringify([]));
      }
      res.writeHead(404); res.end();
    } catch(e){
      res.writeHead(500,{ 'content-type':'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
  server.listen(PORT, ()=> console.log(`[revocation] listening on ${PORT}`));
}

start().catch(e=>{ console.error('[revocation] fatal', e); process.exit(2); });
