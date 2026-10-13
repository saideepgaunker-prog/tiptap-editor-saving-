const DRAFT_KEY = 'tiptap_manuscript_draft';
const SNAPSHOTS_KEY = 'tiptap_manuscript_snapshots';
const SETTINGS_KEY = 'tiptap_manuscript_settings';
const WORD_GOAL_KEY = 'tiptap_manuscript_word_goal';
const COMMENTS_KEY = 'tiptap_manuscript_comments';

export const saveDraft = (html, meta = {}) => {
  try {
    const payload = {
      html,
      meta,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to save draft to localStorage', err);
    return false;
  }
};

export const loadDraft = () => {
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load draft from localStorage', err);
    return null;
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.error(err);
  }
};

export const getSnapshots = () => {
  try {
    const data = localStorage.getItem(SNAPSHOTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveSnapshot = (name, html, wordCount = 0) => {
  try {
    const snapshots = getSnapshots();
    const newSnapshot = {
      id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name || `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toISOString(),
      wordCount,
      html,
    };
    // Keep max 30 snapshots
    const updated = [newSnapshot, ...snapshots].slice(0, 30);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    return newSnapshot;
  } catch (err) {
    console.error('Failed to save snapshot', err);
    return null;
  }
};

export const deleteSnapshot = (id) => {
  try {
    const snapshots = getSnapshots();
    const updated = snapshots.filter((s) => s.id !== id);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete snapshot', err);
    return [];
  }
};

export const getSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data
      ? JSON.parse(data)
      : {
          theme: 'light',
          preset: 'manuscript-standard',
          fontFamily: 'Times New Roman, serif',
          fontSize: '12pt',
          lineHeight: '2',
          paragraphSpacing: '0pt',
          zenMode: false,
          showOutline: false,
          showComments: false,
        };
  } catch {
    return {
      theme: 'light',
      preset: 'manuscript-standard',
      fontFamily: 'Times New Roman, serif',
      fontSize: '12pt',
      lineHeight: '2',
      paragraphSpacing: '0pt',
      zenMode: false,
      showOutline: false,
      showComments: false,
    };
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
};

export const getWordGoal = () => {
  try {
    const data = localStorage.getItem(WORD_GOAL_KEY);
    return data ? JSON.parse(data) : { target: 1000, startCount: 0, date: new Date().toDateString() };
  } catch {
    return { target: 1000, startCount: 0, date: new Date().toDateString() };
  }
};

export const saveWordGoal = (goal) => {
  try {
    localStorage.setItem(WORD_GOAL_KEY, JSON.stringify(goal));
  } catch (err) {
    console.error('Failed to save word goal', err);
  }
};

export const getStoredComments = () => {
  try {
    const data = localStorage.getItem(COMMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredComments = (comments) => {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch (err) {
    console.error('Failed to save comments', err);
  }
};
