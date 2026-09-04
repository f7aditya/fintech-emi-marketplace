import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { prisma } from './prisma.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 4000;

const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Any localhost / 127.0.0.1 / LAN origin, on any port — covers the Expo dev
// server (8081 / 8082 / 19006…) and a physical device hitting the LAN IP.
const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
    origin,
  );

app.use(
  cors({
    origin(origin, cb) {
      // no Origin header = curl / same-origin / native app fetch → always allow
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
      // in development, allow any local origin so the Expo web client just works
      if (!isProd && isLocalOrigin(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  }),
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({
    name: '1Fi Marketplace API',
    status: 'ok',
    endpoints: [
      '/api/health',
      '/api/products',
      '/api/products/:id',
      '/api/products/:id/emi-plans',
      'POST /api/orders',
      '/api/orders',
      '/api/orders/:ref',
    ],
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down', time: new Date().toISOString() });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = /CORS/.test(err.message) ? 403 : 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`1Fi Marketplace API listening on http://localhost:${PORT}`);
  console.log(
    `CORS: ${allowedOrigins.join(', ') || '(none configured)'}${isProd ? '' : ' + any localhost/LAN origin (dev)'}`,
  );
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
