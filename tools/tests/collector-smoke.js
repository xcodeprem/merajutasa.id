#!/usr/bin/env node
import http from 'http';

function postJson(path, body){
  return new Promise((resolve,reject)=>{
    const req = http.request({ hostname:'127.0.0.1', port:4603, path, method:'POST', headers:{ 'content-type':'application/json' }}, res=>{
      let data=''; res.on('data',d=>data+=d); res.on('end',()=>{ try{ resolve({ status:res.statusCode, data: data? JSON.parse(data):{} }); }catch(e){ reject(e);} });
    });
    req.on('error',reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main(){
  const now = new Date().toISOString();
  const evt = { event_name:'hero_view', occurred_at: now, received_at: now, meta: { path:'/' } };
  const r = await postJson('/ingest', evt);
  console.log(JSON.stringify(r,null,2));
}

main().catch(e=>{ console.error('collector-smoke error', e); process.exit(1); });
