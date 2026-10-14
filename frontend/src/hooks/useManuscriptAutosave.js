import { useCallback, useEffect, useRef, useState } from 'react';
import { areManuscriptHtmlEquivalent } from '../utils/htmlNormalizer.js';
import {
  DB_AUTOSAVE_MS,
  DB_RETRY_MS,
  LOCAL_AUTOSAVE_MS,
  getOrCreateDemoUserId,
  isOnline,
  markLocalSynced,
  readLocalManuscript,
  resolveManuscriptForLoad,
  writeLocalManuscript,
} from '../utils/draftSync.js';
import {
  fetchManuscript,
  isRetryableSaveError,
  saveManuscriptToDb,
} from '../utils/manuscriptApi.js';

/**
 * Boot resolve + debounced local/DB HTML autosave for one manuscript per user.
 *
 * saveStatus: 'loading' | 'unsaved' | 'saving' | 'saved' | 'offline' | 'error'
 */
export function useManuscriptAutosave({
  enabled = true,
  userId: userIdProp,
  getHtml,
  getTitle,
  onResolvedContent,
} = {}) {
  const userIdRef = useRef(userIdProp || getOrCreateDemoUserId());
  if (userIdProp) userIdRef.current = userIdProp;
  const [saveStatus, setSaveStatus] = useState(enabled ? 'loading' : 'saved');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [bootDone, setBootDone] = useState(!enabled);
  const [recoveredFromLocal, setRecoveredFromLocal] = useState(false);

  const localTimerRef = useRef(null);
  const dbTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const lastSyncedHtmlRef = useRef(null);
  const pendingHtmlRef = useRef(null);
  const pendingTitleRef = useRef(null);
  const flushingRef = useRef(false);
  const bootDoneRef = useRef(!enabled);
  const getHtmlRef = useRef(getHtml);
  const getTitleRef = useRef(getTitle);
  const onResolvedRef = useRef(onResolvedContent);

  getHtmlRef.current = getHtml;
  getTitleRef.current = getTitle;
  onResolvedRef.current = onResolvedContent;
  bootDoneRef.current = bootDone;

  const clearTimers = () => {
    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    if (dbTimerRef.current) clearTimeout(dbTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    localTimerRef.current = null;
    dbTimerRef.current = null;
    retryTimerRef.current = null;
  };

  const persistLocalNow = useCallback(
    (html, title, { pendingSync } = {}) => {
      const userId = userIdRef.current;
      const online = isOnline();
      const flag = pendingSync != null ? pendingSync : !online;
      writeLocalManuscript(userId, { html, title, pendingSync: flag });
    },
    []
  );

  const flushToDb = useCallback(async () => {
    if (!enabled || flushingRef.current || !bootDoneRef.current) return;
    const html = pendingHtmlRef.current;
    const title = pendingTitleRef.current;
    if (html == null) return;

    if (!isOnline()) {
      persistLocalNow(html, title, { pendingSync: true });
      setSaveStatus('offline');
      return;
    }

    if (
      lastSyncedHtmlRef.current != null &&
      areManuscriptHtmlEquivalent(html, lastSyncedHtmlRef.current)
    ) {
      markLocalSynced(userIdRef.current, { html, title });
      setSaveStatus('saved');
      return;
    }

    flushingRef.current = true;
    setSaveStatus('saving');

    try {
      const saved = await saveManuscriptToDb({
        title,
        html,
      });
      lastSyncedHtmlRef.current = html;
      markLocalSynced(userIdRef.current, {
        html,
        title,
        remoteUpdatedAt: saved?.updatedAt,
      });
      setSaveStatus('saved');
      setLastSavedTime(new Date());

      const latest = getHtmlRef.current?.();
      if (latest != null && !areManuscriptHtmlEquivalent(latest, html)) {
        pendingHtmlRef.current = latest;
        pendingTitleRef.current = getTitleRef.current?.() || title;
        dbTimerRef.current = setTimeout(() => {
          flushToDb();
        }, 0);
      }
    } catch (err) {
      persistLocalNow(html, title, { pendingSync: true });
      if (err?.offline || err?.code === 'OFFLINE') {
        setSaveStatus('offline');
      } else if (isRetryableSaveError(err)) {
        setSaveStatus('error');
        retryTimerRef.current = setTimeout(() => {
          flushToDb();
        }, DB_RETRY_MS);
      } else {
        setSaveStatus('error');
      }
    } finally {
      flushingRef.current = false;
    }
  }, [enabled, persistLocalNow]);

  /** Call from editor onUpdate with already-normalized HTML. */
  const notifyContentChanged = useCallback(
    (normalizedHtml, title) => {
      if (!enabled) return;
      // Do not write/push until Mongo vs local boot finished (prevents sample overwrite)
      if (!bootDoneRef.current) return;

      pendingHtmlRef.current = normalizedHtml;
      pendingTitleRef.current = title || 'Untitled Manuscript';
      setSaveStatus((prev) => (prev === 'offline' ? 'offline' : 'unsaved'));

      if (localTimerRef.current) clearTimeout(localTimerRef.current);
      localTimerRef.current = setTimeout(() => {
        const online = isOnline();
        persistLocalNow(normalizedHtml, pendingTitleRef.current, {
          pendingSync: !online,
        });
        if (!online) setSaveStatus('offline');
      }, LOCAL_AUTOSAVE_MS);

      if (dbTimerRef.current) clearTimeout(dbTimerRef.current);
      dbTimerRef.current = setTimeout(() => {
        flushToDb();
      }, DB_AUTOSAVE_MS);
    },
    [enabled, flushToDb, persistLocalNow]
  );

  const flushNow = useCallback(async () => {
    if (!enabled || !bootDoneRef.current) return;
    if (localTimerRef.current) clearTimeout(localTimerRef.current);
    if (dbTimerRef.current) clearTimeout(dbTimerRef.current);

    const html = getHtmlRef.current?.() ?? pendingHtmlRef.current;
    const title = getTitleRef.current?.() ?? pendingTitleRef.current;
    if (html == null) return;

    pendingHtmlRef.current = html;
    pendingTitleRef.current = title;
    persistLocalNow(html, title, { pendingSync: !isOnline() });
    await flushToDb();
  }, [enabled, flushToDb, persistLocalNow]);

  const flushToDbRef = useRef(flushToDb);
  flushToDbRef.current = flushToDb;

  const applyResolved = useCallback((resolved, remote) => {
    setRecoveredFromLocal(Boolean(resolved.recovered));

    if (resolved.html != null) {
      onResolvedRef.current?.({
        html: resolved.html,
        title: resolved.title,
        source: resolved.source,
      });
      lastSyncedHtmlRef.current =
        resolved.source === 'remote'
          ? resolved.html
          : remote?.html ?? remote?.userContent ?? null;
      pendingHtmlRef.current = resolved.html;
      pendingTitleRef.current = resolved.title;

      if (resolved.source === 'remote') {
        markLocalSynced(userIdRef.current, {
          html: resolved.html,
          title: resolved.title,
          remoteUpdatedAt: remote?.updatedAt,
        });
      }

      if (resolved.source === 'local' && resolved.recovered && isOnline()) {
        setTimeout(() => flushToDbRef.current(), 0);
      }
    }
  }, []);

  // Boot: load Mongo first for cross-device, then merge with local pending only
  useEffect(() => {
    if (!enabled) {
      setBootDone(true);
      bootDoneRef.current = true;
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setSaveStatus('loading');
      setBootDone(false);
      bootDoneRef.current = false;

      const userId = userIdRef.current;
      const local = readLocalManuscript(userId);
      let remote = null;

      try {
        remote = await fetchManuscript(userId);
      } catch {
        // Offline or API down — keep local
      }

      if (cancelled) return;

      const resolved = resolveManuscriptForLoad(local, remote);
      applyResolved(resolved, remote);

      setBootDone(true);
      bootDoneRef.current = true;
      setSaveStatus(
        !isOnline() ? 'offline' : resolved.recovered ? 'unsaved' : 'saved'
      );
      if (resolved.source === 'remote' || (local && !local.pendingSync)) {
        setLastSavedTime(new Date());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userIdProp, applyResolved]);

  // Pull latest from Mongo when returning to the tab / device
  useEffect(() => {
    if (!enabled) return undefined;

    const pullRemoteIfNeeded = async () => {
      if (!bootDoneRef.current || !isOnline() || flushingRef.current) return;

      const userId = userIdRef.current;
      const local = readLocalManuscript(userId);
      // Don't clobber an unsynced local draft mid-edit
      if (local?.pendingSync) {
        flushToDbRef.current();
        return;
      }

      let remote = null;
      try {
        remote = await fetchManuscript(userId);
      } catch {
        return;
      }
      if (!remote) return;

      const currentHtml = getHtmlRef.current?.() ?? local?.html;
      const remoteHtml = remote.html ?? remote.userContent;
      if (
        currentHtml != null &&
        areManuscriptHtmlEquivalent(currentHtml, remoteHtml)
      ) {
        return;
      }

      const resolved = resolveManuscriptForLoad(local, remote);
      if (resolved.source === 'remote') {
        applyResolved(resolved, remote);
        setSaveStatus('saved');
        setLastSavedTime(new Date());
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        pullRemoteIfNeeded();
      }
    };

    const onFocus = () => pullRemoteIfNeeded();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, applyResolved]);

  // Online / offline events
  useEffect(() => {
    if (!enabled) return undefined;

    const onOffline = () => {
      setSaveStatus('offline');
      const html = getHtmlRef.current?.();
      const title = getTitleRef.current?.();
      if (html != null && bootDoneRef.current) {
        persistLocalNow(html, title, { pendingSync: true });
      }
    };

    const onOnline = () => {
      pullAndFlush();
    };

    const pullAndFlush = async () => {
      const local = readLocalManuscript(userIdRef.current);
      if (local?.pendingSync) {
        pendingHtmlRef.current = local.html;
        pendingTitleRef.current = local.title;
        flushToDb();
        return;
      }
      try {
        const remote = await fetchManuscript(userIdRef.current);
        if (remote) {
          const resolved = resolveManuscriptForLoad(local, remote);
          applyResolved(resolved, remote);
        }
      } catch {
        // ignore
      }
      setSaveStatus('saved');
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, flushToDb, persistLocalNow, applyResolved]);

  // Flush on hide / unload
  useEffect(() => {
    if (!enabled) return undefined;

    const flushLocalOnly = () => {
      if (!bootDoneRef.current) return;
      const html = getHtmlRef.current?.();
      const title = getTitleRef.current?.();
      if (html != null) {
        persistLocalNow(html, title, { pendingSync: !isOnline() });
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushLocalOnly();
        flushNow();
      }
    };

    window.addEventListener('beforeunload', flushLocalOnly);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flushLocalOnly);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, flushNow, persistLocalNow]);

  useEffect(() => () => clearTimers(), []);

  return {
    userId: userIdRef.current,
    saveStatus,
    lastSavedTime,
    bootDone,
    recoveredFromLocal,
    notifyContentChanged,
    flushNow,
  };
}

export default useManuscriptAutosave;
