import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb, closeDb } from './db.js';
import manuscriptsRouter from './routes/manuscripts.js';

const PORT = Number(process.env.PORT) || 8787;

/**
 * Allowed browser origins for the Vercel frontend.
 * - CORS_ORIGIN / FRONTEND_ORIGIN: comma-separated exact origins
 * - Also allows https://*.vercel.app preview/prod URLs (demo-friendly)
 * - If none set and ALLOW_ALL_CORS=true, allow any origin
 */
function parseOriginList() {
  const raw = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || '';
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const list = parseOriginList();
  if (process.env.ALLOW_ALL_CORS === 'true' || process.env.ALLOW_ALL_CORS === '1') {
    return true;
  }

  // Dev convenience: no CORS_ORIGIN configured → allow (same as local)
  if (list.length === 0) return true;

  if (list.includes(origin)) return true;

  // Vercel production + preview deployments
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;

  // Custom domains listed with trailing path mistakes already stripped
  return list.some((allowed) => origin === allowed);
}

function corsOriginDelegate(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  console.warn('[tiptap-api] CORS blocked origin:', origin, '| allowed:', parseOriginList());
  callback(new Error(`Not allowed by CORS: ${origin}`));
}

async function main() {
  await connectDb();
  console.log('[tiptap-api] Connected to MongoDB');

  const app = express();
  app.set('trust proxy', 1);

  const listed = parseOriginList();
  console.log(
    '[tiptap-api] CORS_ORIGIN list:',
    listed.length ? listed.join(', ') : '(empty → allow vercel.app + any until locked down)'
  );

  app.use(
    cors({
      origin: corsOriginDelegate,
      methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
      optionsSuccessStatus: 204,
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
    // Avoid crashing preflight with Error from cors callback
    if (String(err?.message || '').startsWith('Not allowed by CORS')) {
      res.status(403).json({ error: 'cors_blocked', message: err.message });
      return;
    }
    res.status(500).json({ error: 'server_error', message: err.message });
  });

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
