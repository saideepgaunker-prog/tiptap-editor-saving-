import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

export const USERS_COLLECTION = 'users';

const JWT_SECRET =
  process.env.JWT_SECRET || 'tiptap-demo-dev-secret-change-me-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';
const SALT_ROUNDS = 10;

export function usersCollection() {
  return getDb().collection(USERS_COLLECTION);
}

export async function ensureUserIndexes() {
  await usersCollection().createIndex({ email: 1 }, { unique: true });
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function publicUser(doc) {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name || '',
    createdAt: doc.createdAt,
  };
}

export function signToken(userDoc) {
  return jwt.sign(
    { sub: String(userDoc._id), email: userDoc.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export async function registerUser({ email, password, name }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    const err = new Error('Valid email is required');
    err.status = 400;
    err.code = 'invalid_email';
    throw err;
  }
  if (!password || String(password).length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    err.code = 'weak_password';
    throw err;
  }

  const existing = await usersCollection().findOne({ email: normalized });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    err.code = 'email_taken';
    throw err;
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
  const doc = {
    _id: new ObjectId(),
    email: normalized,
    passwordHash,
    name: String(name || '').trim() || normalized.split('@')[0],
    createdAt: now,
    updatedAt: now,
  };
  await usersCollection().insertOne(doc);
  const token = signToken(doc);
  return { user: publicUser(doc), token };
}

export async function loginUser({ email, password }) {
  const normalized = normalizeEmail(email);
  const doc = await usersCollection().findOne({ email: normalized });
  if (!doc) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code = 'invalid_credentials';
    throw err;
  }
  const ok = await bcrypt.compare(String(password || ''), doc.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code = 'invalid_credentials';
    throw err;
  }
  const token = signToken(doc);
  return { user: publicUser(doc), token };
}

export async function findUserById(id) {
  let _id;
  try {
    _id = new ObjectId(id);
  } catch {
    return null;
  }
  const doc = await usersCollection().findOne({ _id });
  return doc ? publicUser(doc) : null;
}

/** Express middleware — requires Bearer JWT. Sets req.user = { id, email }. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'unauthorized', message: 'Login required' });
  }
  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    req.user = { id: String(payload.sub), email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'unauthorized', message: 'Session expired — please log in again' });
  }
}
