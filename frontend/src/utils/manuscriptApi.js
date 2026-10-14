/**
 * Production (Vercel): set VITE_API_BASE to Railway origin, e.g. https://xxx.up.railway.app
 * Local: leave empty so Vite proxies /api → backend (vite.config.js)
 */
import { readAuthToken } from './authStorage.js';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

function authHeaders(extra = {}) {
  const token = readAuthToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export class ManuscriptApiError extends Error {
  constructor(message, { code, status, offline } = {}) {
    super(message);
    this.name = 'ManuscriptApiError';
    this.code = code || (offline ? 'OFFLINE' : 'API_ERROR');
    this.status = status;
    this.offline = Boolean(offline);
  }
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch this user's manuscript from Mongo via the demo API.
 * @returns {Promise<object|null>}
 */
export async function fetchManuscript(_userId) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ManuscriptApiError('Offline', { offline: true, code: 'OFFLINE' });
  }

  let res;
  try {
    res = await fetch(apiUrl('/api/manuscripts/me'), {
      method: 'GET',
      headers: authHeaders(),
    });
  } catch {
    throw new ManuscriptApiError('Network error', { offline: true, code: 'OFFLINE' });
  }

  if (res.status === 401) {
    throw new ManuscriptApiError('Please log in again', {
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  if (res.status === 404) return null;

  const body = await parseJson(res);
  if (!res.ok) {
    throw new ManuscriptApiError(body?.message || 'Failed to load manuscript', {
      status: res.status,
      code: body?.error || 'API_ERROR',
    });
  }
  return body?.manuscript || null;
}

/**
 * Upsert Storygroove-style HTML to MongoDB (auth user from JWT).
 */
export async function saveManuscriptToDb({ title, html }) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ManuscriptApiError('Offline', { offline: true, code: 'OFFLINE' });
  }

  let res;
  try {
    res = await fetch(apiUrl('/api/manuscripts/me'), {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        title,
        sceneTitle: title,
        html,
        userContent: html,
      }),
    });
  } catch {
    throw new ManuscriptApiError('Network error', { offline: true, code: 'OFFLINE' });
  }

  if (res.status === 401) {
    throw new ManuscriptApiError('Please log in again', {
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const body = await parseJson(res);
  if (!res.ok) {
    const retryable = !res.status || res.status >= 500 || res.status === 429;
    throw new ManuscriptApiError(body?.message || 'Failed to save manuscript', {
      status: res.status,
      code: retryable ? 'RETRYABLE' : body?.error || 'API_ERROR',
    });
  }
  return body?.manuscript || null;
}

export function isRetryableSaveError(error) {
  if (!error) return false;
  if (error.code === 'OFFLINE' || error.offline) return false;
  if (error.code === 'UNAUTHORIZED') return false;
  if (error.code === 'RETRYABLE') return true;
  if (!error.status) return true;
  return error.status >= 500 || error.status === 429;
}
