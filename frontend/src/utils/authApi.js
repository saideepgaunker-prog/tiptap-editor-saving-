import { readAuthToken } from './authStorage.js';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function registerAccount({ email, password, name }) {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(body?.message || 'Registration failed');
  }
  return body;
}

export async function loginAccount({ email, password }) {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(body?.message || 'Login failed');
  }
  return body;
}

export async function fetchCurrentUser() {
  const token = readAuthToken();
  if (!token) return null;
  const res = await fetch(apiUrl('/api/auth/me'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) return null;
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to load session');
  }
  return body?.user || null;
}
