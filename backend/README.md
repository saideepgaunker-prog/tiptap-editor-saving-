# TipTap Manuscript API (Backend — Railway)

Express + MongoDB API for the TipTap demo editor.

## Local

```bash
cd backend
cp .env.example .env   # set MONGODB_URI
npm install
npm start
```

API: `http://127.0.0.1:8787` — health: `/api/health`

## Railway

1. New project → Deploy from GitHub (or CLI).
2. **Root Directory:** `text-editor-options/tiptap/backend` (or this folder if repo is only backend).
3. Variables:
   - `MONGODB_URI`
   - `MONGODB_DB` = `tiptap_manuscript_demo`
   - `CORS_ORIGIN` = your Vercel URL (e.g. `https://your-app.vercel.app`)
4. Deploy. Copy the public URL → set as `VITE_API_BASE` on the frontend.
