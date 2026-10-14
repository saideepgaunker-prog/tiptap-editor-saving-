import { areManuscriptHtmlEquivalent } from './htmlNormalizer.js';

const USER_ID_KEY = 'tiptap_demo_user_id';
const draftKey = (userId) => `tiptap_manuscript_draft:${userId || 'anonymous'}`;

export const LOCAL_AUTOSAVE_MS = 400;
export const DB_AUTOSAVE_MS = 800;
export const DB_RETRY_MS = 2000;

/** Stable demo user id (one manuscript per user) — only used if auth userId missing. */
export const getOrCreateDemoUserId = () => {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
};

export const readLocalManuscript = (userId) => {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const html =
      typeof parsed.html === 'string'
        ? parsed.html
        : typeof parsed.userContent === 'string'
          ? parsed.userContent
          : null;
    if (typeof html !== 'string') return null;
    return {
      html,
      title:
        typeof parsed.title === 'string'
          ? parsed.title
          : typeof parsed.sceneTitle === 'string'
            ? parsed.sceneTitle
            : 'Untitled Manuscript',
      updatedAt:
        typeof parsed.updatedAt === 'number'
          ? parsed.updatedAt
          : Date.parse(parsed.updatedAt || '') || Date.now(),
      pendingSync: Boolean(parsed.pendingSync),
      savedAt: parsed.savedAt || null,
    };
  } catch {
    return null;
  }
};

/**
 * Persist Storygroove-style HTML locally.
 * @returns {boolean} false on quota / private mode failure
 */
export const writeLocalManuscript = (userId, { html, title, pendingSync = false }) => {
  try {
    const htmlValue = html ?? '<p><br></p>';
    const titleValue = title || 'Untitled Manuscript';
    const payload = {
      html: htmlValue,
      userContent: htmlValue,
      title: titleValue,
      sceneTitle: titleValue,
      updatedAt: Date.now(),
      pendingSync: Boolean(pendingSync),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(userId), JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to write local manuscript', err);
    return false;
  }
};

export const markLocalSynced = (userId, { html, title, remoteUpdatedAt } = {}) => {
  const existing = readLocalManuscript(userId);
  const nextHtml = html ?? existing?.html ?? '<p><br></p>';
  const nextTitle = title ?? existing?.title ?? 'Untitled Manuscript';
  try {
    const remoteMs = remoteUpdatedAt
      ? Date.parse(remoteUpdatedAt) || Date.now()
      : Date.now();
    const payload = {
      html: nextHtml,
      userContent: nextHtml,
      title: nextTitle,
      sceneTitle: nextTitle,
      // Keep local clock aligned with server so other devices win next boot
      updatedAt: remoteMs,
      pendingSync: false,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(userId), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
};

/**
 * Cross-device load rules (authenticated demos):
 * - If local has pendingSync (offline edits waiting), ALWAYS keep local then upload
 *   (never drop mobile offline work on reload)
 * - Otherwise Mongo/remote is source of truth
 */
export const resolveManuscriptForLoad = (local, remote) => {
  if (!local && !remote) {
    return { html: null, title: null, source: 'empty', recovered: false };
  }

  if (local && !remote) {
    return {
      html: local.html,
      title: local.title,
      source: 'local',
      recovered: Boolean(local.pendingSync),
    };
  }

  if (!local && remote) {
    return {
      html: remote.html ?? remote.userContent,
      title: remote.title ?? remote.sceneTitle,
      source: 'remote',
      recovered: false,
    };
  }

  const remoteHtml = remote.html ?? remote.userContent;
  const remoteTitle = remote.title ?? remote.sceneTitle;
  const remoteTs = Date.parse(remote.updatedAt || '') || 0;
  const localTs = local.updatedAt || 0;
  const htmlDiffers = !areManuscriptHtmlEquivalent(local.html, remoteHtml);

  // Offline edits waiting to upload — never discard on reload (mobile fix)
  if (local.pendingSync && htmlDiffers) {
    return {
      html: local.html,
      title: local.title || remoteTitle,
      source: 'local',
      recovered: true,
    };
  }

  if (local.pendingSync && !htmlDiffers) {
    return {
      html: remoteHtml,
      title: remoteTitle || local.title,
      source: 'remote',
      recovered: false,
    };
  }

  // Synced: prefer remote for cross-device consistency
  if (remoteTs >= localTs || !htmlDiffers) {
    return {
      html: remoteHtml,
      title: remoteTitle || local.title,
      source: 'remote',
      recovered: false,
    };
  }

  return {
    html: remoteHtml,
    title: remoteTitle || local.title,
    source: 'remote',
    recovered: false,
  };
};

/** Fast flag only — prefer probeApiOnline / isReallyOnline for sync decisions. */
export const isOnline = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine !== false;
