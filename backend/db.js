import { MongoClient } from 'mongodb';
import {
  NOVEL_COLLECTION,
  USER_CONTENT_COLLECTION,
  novelIndexes,
  userContentIndexes,
} from './schemas/editorSchemas.js';

let client;
let db;

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and add your connection string.'
    );
  }

  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'tiptap_manuscript_demo');

  const novels = db.collection(NOVEL_COLLECTION);
  const userContent = db.collection(USER_CONTENT_COLLECTION);

  for (const idx of novelIndexes) {
    await novels.createIndex(idx.key, { unique: Boolean(idx.unique) });
  }
  for (const idx of userContentIndexes) {
    await userContent.createIndex(idx.key, { unique: Boolean(idx.unique) });
  }

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
