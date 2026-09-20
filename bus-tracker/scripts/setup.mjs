import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const key = () => randomBytes(18).toString('hex');
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const content = [
  '# Private demo keys. Never commit this file or put keys into a URL.',
  'PORT=3000',
  'HOST=0.0.0.0',
  `DASHBOARD_KEY=${key()}`,
  `DRIVER_KEYS_JSON=${JSON.stringify({ 'BUS-001': key(), 'BUS-002': key() })}`,
  '',
].join('\n');

try {
  writeFileSync(envPath, content, { flag: 'wx', mode: 0o600 });
  console.log('Setup complete. Open .env in VS Code to see your dashboard key and bus keys.');
  console.log('Next: npm run build, then npm start');
} catch (error) {
  if (error.code === 'EEXIST') {
    console.log('.env already exists. Your keys were preserved.');
  } else {
    throw error;
  }
}
