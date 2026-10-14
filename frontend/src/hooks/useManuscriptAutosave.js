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
import { isReallyOnline, probeApiOnline } from '../utils/connectivity.js';
import {
  fetchManuscript,
  isRetryableSaveError,
  saveManuscriptToDb,
} from '../utils/manuscriptApi.js';

const ONLINE_POLL_MS = 3000;

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
  const pollTimerRef = useRef(null);
  const lastSyncedHtmlRef = useRef(null);
  const pendingHtmlRef = useRef(null);
  const pendingTitleRef = useRef(null);
  const flushingRef = useRef(false);
  const bootDoneRef = useRef(!enabled);
  const wasOfflineRef = useRef(false);
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
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    localTimerRef.current = null;
    dbTimerRef.current = null;
    retryTimerRef.current = null;
    pollTimerRef.current = null;
  };

  const persistLocalNow = useCallback((html, title, { pendingSync } = {}) => {
    const userId = userIdRef.current;
    const flag = pendingSync != null ? pendingSync : !isOnline();
    writeLocalManuscript(userId, { html, title, pendingSync: flag });
  }, []);

  const flushToDb = useCallback(async () => {
    if (!enabled || flushingRef.current || !bootDoneRef.current) return;
    const html = pendingHtmlRef.current;
    const title = pendingTitleRef.current;
    if (html == null) return;

    const online = await isReallyOnline();
    if (!online) {
      wasOfflineRef.current = true;
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
      wasOfflineRef.current = false;
      return;
    }

    flushingRef.current = true;
    setSaveStatus('saving');

    try {
      const saved = await saveManuscriptToDb({ title, html });
      lastSyncedHtmlRef.current = html;
      markLocalSynced(userIdRef.current, {
        html,
        title,
        remoteUpdatedAt: saved?.updatedAt,
      });
      setSaveStatus('saved');
      setLastSavedTime(new Date());
      wasOfflineRef.current = false;

      const latest = getHtmlRef.current?.();
      if (latest != null && !areManuscriptHtmlEquivalent(latest, html)) {
        pendingHtmlRef.current = latest;
        pendingTitleRef.current = getTitleRef.current?.() || title;
        dbTimerRef.current = setTimeout(() => {
          flushToDb();
        }, 0);
      }
    } catch (err) {
      wasOfflineRef.current = true;
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

  const flushToDbRef = useRef(flushToDb);
  flushToDbRef.current = flushToDb;

  /** After reconnect: push any pending local draft to Mongo. */
  const syncPendingAfterReconnect = useCallback(async () => {
    if (!enabled || !bootDoneRef.current) return;

    const online = await isReallyOnline();
    if (!online) {
      wasOfflineRef.current = true;
      setSaveStatus('offline');
      return;
    }

    const local = readLocalManuscript(userIdRef.current);
    const liveHtml = getHtmlRef.current?.();
    const liveTitle = getTitleRef.current?.();

    // Prefer in-memory editor content if present
    if (liveHtml != null) {
      pendingHtmlRef.current = liveHtml;
      pendingTitleRef.current = liveTitle || local?.title || 'Untitled Manuscript';
      persistLocalNow(liveHtml, pendingTitleRef.current, { pendingSync: true });
    } else if (local?.pendingSync && local.html) {
      pendingHtmlRef.current = local.html;
      pendingTitleRef.current = local.title;
    } else if (local?.html) {
      pendingHtmlRef.current = local.html;
      pendingTitleRef.current = local.title;
    }

    if (pendingHtmlRef.current != null) {
      await flushToDbRef.current();
    } else {
      setSaveStatus('saved');
      wasOfflineRef.current = false;
    }
  }, [enabled, persistLocalNow]);

  const syncPendingRef = useRef(syncPendingAfterReconnect);
  syncPendingRef.current = syncPendingAfterReconnect;

  /** Call from editor onUpdate with already-normalized HTML. */
  const notifyContentChanged = useCallback(
    (normalizedHtml, title) => {
      if (!enabled) return;
      if (!bootDoneRef.current) return;

      pendingHtmlRef.current = normalizedHtml;
      pendingTitleRef.current = title || 'Untitled Manuscript';

      const browserOffline = !isOnline();
      const treatAsOffline = browserOffline || wasOfflineRef.current;
      setSaveStatus((prev) =>
        treatAsOffline || prev === 'offline' ? 'offline' : 'unsaved'
      );

      // Always keep pendingSync until Mongo confirms — mobile navigator.onLine lies.
      // Offline / was-offline: write localStorage immediately (debounce can be killed).
      if (treatAsOffline) {
        persistLocalNow(normalizedHtml, pendingTitleRef.current, {
          pendingSync: true,
        });
        setSaveStatus('offline');
      } else {
        if (localTimerRef.current) clearTimeout(localTimerRef.current);
        localTimerRef.current = setTimeout(() => {
          persistLocalNow(normalizedHtml, pendingTitleRef.current, {
            pendingSync: true,
          });
          if (!isOnline()) {
            wasOfflineRef.current = true;
            setSaveStatus('offline');
          }
        }, LOCAL_AUTOSAVE_MS);
      }

      if (dbTimerRef.current) clearTimeout(dbTimerRef.current);
      dbTimerRef.current = setTimeout(() => {
        flushToDb();
      }, treatAsOffline ? 500 : DB_AUTOSAVE_MS);
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
    const online = await isReallyOnline();
    persistLocalNow(html, title, { pendingSync: !online });
    if (!online) {
      wasOfflineRef.current = true;
      setSaveStatus('offline');
      return;
    }
    await flushToDb();
  }, [enabled, flushToDb, persistLocalNow]);

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
      } else if (resolved.source === 'local' && resolved.recovered) {
        // Keep pendingSync so reconnect/reload still uploads
        persistLocalNow(resolved.html, resolved.title, { pendingSync: true });
      }

      if (resolved.source === 'local' && resolved.recovered) {
        setTimeout(() => flushToDbRef.current(), 0);
      }
    }
  }, [persistLocalNow]);

  // Boot
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

      const online = await isReallyOnline();
      if (online) {
        try {
          remote = await fetchManuscript(userId);
        } catch {
          wasOfflineRef.current = true;
        }
      } else {
        wasOfflineRef.current = true;
      }

      if (cancelled) return;

      const resolved = resolveManuscriptForLoad(local, remote);
      applyResolved(resolved, remote);

      setBootDone(true);
      bootDoneRef.current = true;
      setSaveStatus(
        !online || wasOfflineRef.current
          ? resolved.recovered
            ? 'unsaved'
            : online
              ? 'saved'
              : 'offline'
          : resolved.recovered
            ? 'unsaved'
            : 'saved'
      );
      if (!online) setSaveStatus('offline');
      if (resolved.source === 'remote' || (local && !local.pendingSync)) {
        setLastSavedTime(new Date());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userIdProp, applyResolved]);

  // Mobile-friendly reconnect detection: events + polling + focus/pageshow
  useEffect(() => {
    if (!enabled) return undefined;

    const handlePossiblyOnline = async () => {
      const online = await probeApiOnline();
      if (!online) {
        wasOfflineRef.current = true;
        setSaveStatus((s) => (s === 'saving' ? s : 'offline'));
        // Snapshot editor to local immediately
        const html = getHtmlRef.current?.();
        const title = getTitleRef.current?.();
        if (html != null && bootDoneRef.current) {
          persistLocalNow(html, title, { pendingSync: true });
        }
        return;
      }

      if (wasOfflineRef.current || readLocalManuscript(userIdRef.current)?.pendingSync) {
        await syncPendingRef.current();
      }
    };

    const onBrowserOnline = () => {
      handlePossiblyOnline();
    };

    const onBrowserOffline = () => {
      wasOfflineRef.current = true;
      setSaveStatus('offline');
      const html = getHtmlRef.current?.();
      const title = getTitleRef.current?.();
      if (html != null && bootDoneRef.current) {
        persistLocalNow(html, title, { pendingSync: true });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        handlePossiblyOnline();
      } else {
        // Tab backgrounded — flush local now (mobile kill risk)
        const html = getHtmlRef.current?.();
        const title = getTitleRef.current?.();
        if (html != null && bootDoneRef.current) {
          persistLocalNow(html, title, {
            pendingSync: wasOfflineRef.current || !isOnline(),
          });
        }
        flushToDbRef.current();
      }
    };

    const onPageShow = (e) => {
      // bfcache restore on iOS
      if (e?.persisted || document.visibilityState === 'visible') {
        handlePossiblyOnline();
      }
    };

    window.addEventListener('online', onBrowserOnline);
    window.addEventListener('offline', onBrowserOffline);
    window.addEventListener('focus', handlePossiblyOnline);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisible);

    // Poll while tab visible — critical for mobile reconnect
    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      handlePossiblyOnline();
    }, ONLINE_POLL_MS);

    return () => {
      window.removeEventListener('online', onBrowserOnline);
      window.removeEventListener('offline', onBrowserOffline);
      window.removeEventListener('focus', handlePossiblyOnline);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisible);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };
  }, [enabled, persistLocalNow]);

  // Flush on unload
  useEffect(() => {
    if (!enabled) return undefined;

    const flushLocalOnly = () => {
      if (!bootDoneRef.current) return;
      const html = getHtmlRef.current?.();
      const title = getTitleRef.current?.();
      if (html == null) return;
      const unsynced =
        wasOfflineRef.current ||
        !isOnline() ||
        lastSyncedHtmlRef.current == null ||
        !areManuscriptHtmlEquivalent(html, lastSyncedHtmlRef.current);
      persistLocalNow(html, title, { pendingSync: unsynced });
    };

    window.addEventListener('beforeunload', flushLocalOnly);
    window.addEventListener('pagehide', flushLocalOnly);
    return () => {
      window.removeEventListener('beforeunload', flushLocalOnly);
      window.removeEventListener('pagehide', flushLocalOnly);
    };
  }, [enabled, persistLocalNow]);

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
