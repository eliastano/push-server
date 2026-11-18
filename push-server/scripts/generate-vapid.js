import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import webpush from 'web-push';

const envPath = new URL('../.env', import.meta.url);
const examplePath = new URL('../.env.example', import.meta.url);

if (existsSync(envPath)) {
  console.error('Ya existe push-server/.env. No lo sobrescribí para proteger tus claves.');
  process.exit(1);
}

const template = readFileSync(examplePath, 'utf8');
const keys = webpush.generateVAPIDKeys();
const env = template
  .replace('VAPID_PUBLIC_KEY=', `VAPID_PUBLIC_KEY=${keys.publicKey}`)
  .replace('VAPID_PRIVATE_KEY=', `VAPID_PRIVATE_KEY=${keys.privateKey}`);

writeFileSync(envPath, env, { flag: 'wx' });
console.log('Se creó push-server/.env con un par VAPID nuevo. No compartas ni publiques ese archivo.');
console.log(`Clave pública para Angular:\n${keys.publicKey}`);
