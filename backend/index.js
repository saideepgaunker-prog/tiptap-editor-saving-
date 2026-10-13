import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb, closeDb } from './db.js';
import manuscriptsRouter from './routes/manuscripts.js';

const PORT = Number(process.env.PORT) || 8787;

/** Comma-separated list of allowed frontend origins (Vercel URL). Empty = reflect request origin (dev). */
function buildCorsOrigin() {
  const raw = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || '';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return true;
  if (list.length === 1) return list[0];
  return list;
}

async function main() {
  await connectDb();
  console.log('[tiptap-api] Connected to MongoDB');

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: buildCorsOrigin(),
      methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
    })
  );
  app.use(express.json({ limit: '5mb' }));

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'tiptap-manuscript-api',
      hint: 'API only — host the Vite frontend on Vercel and set VITE_API_BASE to this URL.',
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tiptap-manuscript-api' });
  });

  app.use('/api/manuscripts', manuscriptsRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'server_error', message: err.message });
  });

  // Railway (and most PaaS) require binding 0.0.0.0
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[tiptap-api] Listening on 0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[tiptap-api] Failed to start', err);
  process.exit(1);
});
