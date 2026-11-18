import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import pg from 'pg';
import webpush from 'web-push';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT) || 3000;
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const allowedOrigins = (process.env.CORS_ORIGINS || [
  'http://localhost:4200',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
].join(',')).split(',').map((origin) => origin.trim()).filter(Boolean);

if (!publicKey || !privateKey) {
  console.error('Faltan VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY. Ejecuta "npm run generate:vapid" o configúralas en el entorno.');
  process.exit(1);
}

webpush.setVapidDetails(subject, publicKey, privateKey);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
}));
app.use(express.json({ limit: '32kb' }));

const memorySubscriptions = new Map();
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

async function initializeStorage() {
  if (!pool) {
    console.warn('DATABASE_URL no está configurada: las suscripciones solo vivirán en memoria y se perderán al reiniciar.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      subscription JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function saveSubscription(subscription) {
  if (!pool) {
    memorySubscriptions.set(subscription.endpoint, subscription);
    return;
  }

  await pool.query(
    `INSERT INTO push_subscriptions (endpoint, subscription)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (endpoint) DO UPDATE SET subscription = EXCLUDED.subscription`,
    [subscription.endpoint, JSON.stringify(subscription)],
  );
}

async function getSubscriptions() {
  if (!pool) return [...memorySubscriptions.values()];
  const result = await pool.query('SELECT subscription FROM push_subscriptions');
  return result.rows.map((row) => row.subscription);
}

async function removeSubscription(endpoint) {
  if (!pool) {
    memorySubscriptions.delete(endpoint);
    return;
  }
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
}

async function countSubscriptions() {
  if (!pool) return memorySubscriptions.size;
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM push_subscriptions');
  return result.rows[0].count;
}

app.get('/api/health', async (_request, response, next) => {
  try {
    response.json({ status: 'ok', subscriptions: await countSubscriptions() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/vapid-public-key', (_request, response) => {
  response.json({ publicKey });
});

app.post('/api/subscribe', async (request, response, next) => {
  const subscription = request.body;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return response.status(400).json({ error: 'La suscripción push está incompleta.' });
  }

  try {
    await saveSubscription(subscription);
    const total = await countSubscriptions();
    console.info(`[push] Suscripción registrada correctamente. Total: ${total}.`);
    return response.status(201).json({ subscribed: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/push', async (request, response, next) => {
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';
  const body = typeof request.body?.body === 'string' ? request.body.body.trim() : '';
  if (!title || !body) {
    return response.status(400).json({ error: 'Se requieren title y body.' });
  }

  try {
    const subscriptions = await getSubscriptions();
    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { onActionClick: { default: { operation: 'openWindow', url: '/' } } },
      },
    });

    let sent = 0;
    let failed = 0;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        failed += 1;
        if (error.statusCode === 404 || error.statusCode === 410) {
          await removeSubscription(subscription.endpoint);
        } else {
          console.error('Falló una entrega Web Push:', error.statusCode || error.message);
        }
      }
    }

    console.info(`[push] Envío terminado. Enviadas: ${sent}; fallidas: ${failed}; suscripciones: ${subscriptions.length}.`);
    return response.json({ enviadas: sent, fallidas: failed, suscripciones: subscriptions.length });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error.message || error);
  response.status(500).json({ error: 'Error interno del servidor push.' });
});

initializeStorage()
  .then(() => app.listen(port, () => console.log(`Servidor push listo en http://localhost:${port}`)))
  .catch((error) => {
    console.error('No se pudo iniciar el almacenamiento de suscripciones:', error.message);
    process.exit(1);
  });
