import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { novelsCollection, userContentCollection } from '../db.js';
import {
  DEMO_SCENE_DEFAULTS,
  serializeUserContentDoc,
} from '../schemas/editorSchemas.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.use(requireAuth);

/** Mirror Storygroove: HTML → plain text companion (not on UserContent in prod, handy for demo). */
function htmlToPlainText(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countWords(plainText = '') {
  const t = String(plainText).trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

async function ensureDemoNovel(userId, title) {
  const novels = novelsCollection();
  let novel = await novels.findOne({ user: userId, isDemoManuscript: true });
  if (novel) return novel;

  const now = new Date();
  const doc = {
    _id: new ObjectId(),
    user: userId,
    name: title || 'Untitled Manuscript',
    wordCount: 0,
    isDemoManuscript: true,
    genre: null,
    summary: null,
    createdAt: now,
    updatedAt: now,
  };
  await novels.insertOne(doc);
  return doc;
}

/**
 * GET /api/manuscripts/me
 * Loads the UserContent row for the authenticated user.
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const contentCol = userContentCollection();
    const doc = await contentCol.findOne({
      user: userId,
      deletedAt: null,
      promptKey: DEMO_SCENE_DEFAULTS.promptKey,
    });

    if (!doc) {
      return res.status(404).json({ error: 'not_found', manuscript: null });
    }

    let novel = null;
    if (doc.novelId) {
      novel = await novelsCollection().findOne({ _id: doc.novelId });
    }

    return res.json({ manuscript: serializeUserContentDoc(doc, novel) });
  } catch (err) {
    console.error('GET /manuscripts/me failed', err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

/**
 * PUT /api/manuscripts/me
 * Body: { title?, html }  (html = Storygroove-normalized userContent)
 */
router.put('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const html =
      typeof req.body?.html === 'string'
        ? req.body.html
        : typeof req.body?.userContent === 'string'
          ? req.body.userContent
          : null;
    const title =
      (typeof req.body?.title === 'string' && req.body.title.trim()) ||
      (typeof req.body?.sceneTitle === 'string' && req.body.sceneTitle.trim()) ||
      'Untitled Manuscript';

    if (html == null) {
      return res.status(400).json({ error: 'html (userContent) is required' });
    }

    const now = new Date();
    const plainText = htmlToPlainText(html);
    const wordCount = countWords(plainText);

    const novel = await ensureDemoNovel(userId, title);
    await novelsCollection().updateOne(
      { _id: novel._id },
      {
        $set: {
          name: title,
          wordCount,
          updatedAt: now,
        },
      }
    );

    const contentCol = userContentCollection();
    const filter = {
      user: userId,
      novelId: novel._id,
      promptKey: DEMO_SCENE_DEFAULTS.promptKey,
    };

    await contentCol.updateOne(
      filter,
      {
        $set: {
          user: userId,
          novelId: novel._id,
          userContent: html,
          plainText,
          sceneTitle: title,
          sceneIndex: DEMO_SCENE_DEFAULTS.sceneIndex,
          actNumber: DEMO_SCENE_DEFAULTS.actNumber,
          chapterNumber: DEMO_SCENE_DEFAULTS.chapterNumber,
          chapterSuffix: DEMO_SCENE_DEFAULTS.chapterSuffix,
          chapterLabel: DEMO_SCENE_DEFAULTS.chapterLabel,
          pov: DEMO_SCENE_DEFAULTS.pov,
          timeline: DEMO_SCENE_DEFAULTS.timeline,
          chapterSummary: DEMO_SCENE_DEFAULTS.chapterSummary,
          isUserAdded: DEMO_SCENE_DEFAULTS.isUserAdded,
          deletedAt: null,
          archivedAt: null,
          promptKey: DEMO_SCENE_DEFAULTS.promptKey,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          archivedFromActNumber: null,
          archivedFromSceneIndex: null,
        },
      },
      { upsert: true }
    );

    const doc = await contentCol.findOne(filter);
    const updatedNovel = await novelsCollection().findOne({ _id: novel._id });

    return res.json({
      manuscript: serializeUserContentDoc(doc, updatedNovel),
    });
  } catch (err) {
    console.error('PUT /manuscripts/me failed', err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

export default router;
