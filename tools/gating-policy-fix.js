import { promises as fs } from 'fs';

async function main(){
  const path = 'docs/integrity/gating-policy-v1.json';
  const obj = JSON.parse(await fs.readFile(path,'utf8'));
  let changed=false;
  if(!obj.generated_utc){ obj.generated_utc = new Date().toISOString(); changed=true; }
  const required = ['version','wave','thresholds'];
  for(const k of required){ if(!(k in obj)) {throw new Error('Missing key '+k);} }
  if(typeof obj.thresholds !== 'object') {throw new Error('thresholds must be object');}
  if(changed){
    await fs.writeFile(path, JSON.stringify(obj,null,2));
    console.log('Updated generated_utc');
  } else {
    console.log('No changes');
  }
}
main().catch(e=>{ console.error('gating-policy-fix error', e); process.exit(1); });
