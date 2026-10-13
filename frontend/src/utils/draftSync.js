import { areManuscriptHtmlEquivalent } from './htmlNormalizer.js';

const USER_ID_KEY = 'tiptap_demo_user_id';
const draftKey = (userId) => `tiptap_manuscript_draft:${userId || 'anonymous'}`;

export const LOCAL_AUTOSAVE_MS = 400;
export const DB_AUTOSAVE_MS = 800;
export const DB_RETRY_MS = 2000;

/** Stable demo user id (one manuscript per user). */
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
    // Mirror Storygroove UserContent field names alongside editor aliases
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
    const payload = {
      html: nextHtml,
      title: nextTitle,
      updatedAt: remoteUpdatedAt
        ? Date.parse(remoteUpdatedAt) || Date.now()
        : existing?.updatedAt || Date.now(),
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
 * Prefer newer / unsynced local HTML over older DB HTML.
 * Matches Storygroove resolveDraftForScene intent.
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
      recovered: true,
    };
  }

  if (!local && remote) {
    return {
      html: remote.html,
      title: remote.title,
      source: 'remote',
      recovered: false,
    };
  }

  const remoteTs = Date.parse(remote.updatedAt || '') || 0;
  const localTs = local.updatedAt || 0;
  const htmlDiffers = !areManuscriptHtmlEquivalent(local.html, remote.html);

  // Local wins when it is newer OR still waiting to sync
  if (local.pendingSync || localTs > remoteTs || (htmlDiffers && localTs >= remoteTs)) {
    return {
      html: local.html,
      title: local.title || remote.title,
      source: 'local',
      recovered: htmlDiffers || local.pendingSync,
    };
  }

  return {
    html: remote.html,
    title: remote.title || local.title,
    source: 'remote',
    recovered: false,
  };
};

export const isOnline = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine !== false;
