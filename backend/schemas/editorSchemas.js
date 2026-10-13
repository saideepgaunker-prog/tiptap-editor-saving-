/**
 * Demo Mongo schemas aligned with Storygroove text-editor collections.
 *
 * Source of truth in production:
 * - storygroove-be-main/models/userContentModel.js  → prose HTML in `userContent`
 * - storygroove-be-main/models/novelModel.js        → book shell (name, wordCount, …)
 *
 * This TipTap MVP stores one scene / one manuscript per demo user, but keeps
 * the same field names so a later merge into Storygroove is straightforward.
 */

/** Subset of Novel used by the manuscript editor demo. */
export const NOVEL_COLLECTION = 'novels';

export const novelIndexes = [{ key: { user: 1 }, unique: false }];

/**
 * Subset of UserContent — the row the Book Editor autosaves into.
 * `userContent` holds Storygroove/Quill-compatible HTML.
 */
export const USER_CONTENT_COLLECTION = 'usercontent';

export const userContentIndexes = [
  { key: { user: 1, novelId: 1 }, unique: true },
  { key: { novelId: 1, user: 1, deletedAt: 1 } },
];

/** Defaults for the single-document demo (one manuscript = one scene). */
export const DEMO_SCENE_DEFAULTS = {
  promptKey: 'tiptap_demo_manuscript',
  sceneIndex: 1,
  actNumber: 1,
  chapterNumber: 1,
  chapterSuffix: null,
  chapterLabel: null,
  pov: null,
  timeline: null,
  chapterSummary: null,
  isUserAdded: true,
  deletedAt: null,
  archivedAt: null,
  archivedFromActNumber: null,
  archivedFromSceneIndex: null,
};

/**
 * Shape returned to the TipTap client (maps Storygroove fields ↔ editor props).
 */
export function serializeUserContentDoc(doc, novel = null) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    userId: String(doc.user),
    novelId: doc.novelId ? String(doc.novelId) : null,
    // Editor-facing aliases
    html: doc.userContent || '<p><br></p>',
    title: doc.sceneTitle || novel?.name || 'Untitled Manuscript',
    plainText: doc.plainText || '',
    // Storygroove field names
    userContent: doc.userContent || '<p><br></p>',
    sceneTitle: doc.sceneTitle || 'Untitled Manuscript',
    sceneIndex: doc.sceneIndex ?? 1,
    actNumber: doc.actNumber ?? 1,
    chapterNumber: doc.chapterNumber ?? 1,
    chapterLabel: doc.chapterLabel ?? null,
    wordCount: novel?.wordCount ?? null,
    novelName: novel?.name || doc.sceneTitle || 'Untitled Manuscript',
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}
