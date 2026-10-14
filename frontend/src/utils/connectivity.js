/**
 * Mobile Safari/Chrome often miss `online` events and lie about navigator.onLine.
 * Probe the API health endpoint to know if we can sync.
 */

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

function healthUrl() {
  return `${API_BASE}/api/health`;
}

/** navigator.onLine only — fast but unreliable on mobile. */
export const isBrowserOnlineFlag = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine !== false;

/**
 * Active connectivity check (works on mobile after airplane mode off).
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function probeApiOnline(timeoutMs = 4000) {
  if (typeof fetch === 'undefined') return true;
  // If browser says offline, still probe — some mobiles keep the flag wrong either way
  const ctrl =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      ctrl?.abort();
    } catch {
      // ignore
    }
  }, timeoutMs);

  try {
    const res = await fetch(healthUrl(), {
      method: 'GET',
      cache: 'no-store',
      signal: ctrl?.signal,
      headers: { Accept: 'application/json' },
    });
    return Boolean(res && res.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Prefer probe result; fall back to navigator flag if probe can't run. */
export async function isReallyOnline() {
  if (typeof window === 'undefined') return true;
  return probeApiOnline();
}
