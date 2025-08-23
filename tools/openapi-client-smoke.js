import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const clientPath = path.resolve('public/equity-ui-v2/src/services/generatedClient.js');
  const mod = await import(url.pathToFileURL(clientPath));
  const baseURL = process.env.GATEWAY_BASE_URL || 'http://localhost:8080';
  const client = mod.createApiClient({ baseURL });
  const results = {};
  try {
    results.health = await client.getHealth();
  } catch (e) {
    results.health = { error: e?.normalized || e?.message || 'unknown' };
  }
  try {
    results.services = await client.getServices();
  } catch (e) {
    results.services = { error: e?.normalized || e?.message || 'unknown' };
  }
  console.log(JSON.stringify({ baseURL, results }, null, 2));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
