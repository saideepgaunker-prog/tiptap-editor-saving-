import { MongoClient } from 'mongodb';
import {
  NOVEL_COLLECTION,
  USER_CONTENT_COLLECTION,
  novelIndexes,
  userContentIndexes,
} from './schemas/editorSchemas.js';

let client;
let db;

/** Strip quotes / whitespace Railway UI sometimes adds when pasting. */
function normalizeMongoUri(raw) {
  let uri = String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');
  return uri;
}

function atlasHelpMessage(err) {
  const msg = String(err?.message || err || '');

  if (/bad auth|Authentication failed/i.test(msg)) {
    return (
      '\n\n[Atlas auth failed] Check Railway Variable MONGODB_URI:\n' +
      '1. No quotes around the value\n' +
      '2. Username + password match Atlas → Database Access\n' +
      '3. If password has @ # % etc, URL-encode them\n' +
      '4. Full form: mongodb+srv://USER:PASS@host/?retryWrites=true&w=majority\n' +
      '5. Or reset the DB user password in Atlas and update Railway\n'
    );
  }

  const isTls =
    /SSL|TLS|tlsv1|ALERT_INTERNAL/i.test(msg) ||
    err?.name === 'MongoServerSelectionError' ||
    err?.name === 'MongoNetworkError';

  if (!isTls) return '';

  return (
    '\n\n[Atlas / Railway] Usual fixes:\n' +
    '1. MongoDB Atlas → Network Access → Allow Access from Anywhere (0.0.0.0/0)\n' +
    '2. Use a full SRV URI with ?retryWrites=true&w=majority\n' +
    '3. Atlas → Database Access: user can read/write the DB.\n'
  );
}

export async function connectDb() {
  const uri = normalizeMongoUri(process.env.MONGODB_URI);
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Set it in Railway Variables (or backend/.env locally).'
    );
  }

  if (db) return db;

  // Log host only (never user/password) to confirm Railway picked up the var
  try {
    const host = uri.split('@')[1]?.split('/')[0] || '(unknown host)';
    console.log('[tiptap-api] Connecting to Mongo host:', host);
  } catch {
    // ignore
  }

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
  });

  try {
    await client.connect();
    // Verify we can talk to the primary
    await client.db('admin').command({ ping: 1 });
  } catch (err) {
    try {
      await client.close();
    } catch {
      // ignore
    }
    client = null;
    const help = atlasHelpMessage(err);
    throw new Error(`${err.message}${help}`);
  }

  db = client.db(process.env.MONGODB_DB || 'tiptap_manuscript_demo');

  const novels = db.collection(NOVEL_COLLECTION);
  const userContent = db.collection(USER_CONTENT_COLLECTION);

  for (const idx of novelIndexes) {
    await novels.createIndex(idx.key, { unique: Boolean(idx.unique) });
  }
  for (const idx of userContentIndexes) {
    await userContent.createIndex(idx.key, { unique: Boolean(idx.unique) });
  }

  console.log('[tiptap-api] MongoDB ping ok, db=', db.databaseName);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDb() first.');
  }
  return db;
}

export function novelsCollection() {
  return getDb().collection(NOVEL_COLLECTION);
}

export function userContentCollection() {
  return getDb().collection(USER_CONTENT_COLLECTION);
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
