#!/usr/bin/env node
import http from 'http';

function httpJson(options, body){
  return new Promise((resolve,reject)=>{
    const req = http.request(options, res=>{
      let data=''; res.on('data',d=>data+=d); res.on('end',()=>{ try{ resolve({ status:res.statusCode, data: data? JSON.parse(data):{} }); }catch(e){ reject(e);} });
    });
    req.on('error',reject);
    if (body){ req.write(JSON.stringify(body)); }
    req.end();
  });
}

async function main(){
  const canonical = '{"type":"CREDENTIAL_ISSUED","credId":"urn:merajutasa:cred:test","ts":"'+new Date().toISOString()+'"}';
  const sign = await httpJson({ hostname:'127.0.0.1', port:4601, path:'/sign', method:'POST', headers:{'content-type':'application/json'}}, { payload: canonical });
  if (sign.status!==200) throw new Error('sign failed '+sign.status);
  const pub = await httpJson({ hostname:'127.0.0.1', port:4601, path:'/pubkey', method:'GET' });
  const append = await httpJson({ hostname:'127.0.0.1', port:4602, path:'/append', method:'POST', headers:{'content-type':'application/json'}}, { canonical, signature: sign.data.signature, publicKeyPem: pub.data.publicKeyPem });
  console.log(JSON.stringify(append,null,2));
}

main().catch(e=>{ console.error('chain-append-smoke error', e); process.exit(1); });
