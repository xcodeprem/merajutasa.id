/** Shared utility functions for disclaimers lint & tests */
import { createHash } from 'crypto';

export function sha256(str){ return createHash('sha256').update(str).digest('hex'); }
export function tokenize(text){
  return text
    .toLowerCase()
    .replace(/["'`,.;:!?()\[\]{}]/g,' ')
    .split(/\s+/)
    .filter(Boolean);
}
export function overlapCoefficient(aTokens,bTokens){
  const aSet=new Set(aTokens); const bSet=new Set(bTokens); let inter=0; aSet.forEach(t=>{ if(bSet.has(t)) inter++; });
  return inter/(Math.min(aSet.size,bSet.size)||1);
}
