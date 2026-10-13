# TipTap Manuscript Editor (Frontend — Vercel)

Vite + React TipTap demo UI.

## Local

```bash
# Terminal 1 — backend
cd ../backend && npm install && npm start

# Terminal 2 — frontend
cd ../frontend
cp .env.example .env.local   # leave VITE_API_BASE empty for proxy
npm install
npm run dev
```

Open `http://localhost:5173`

## Vercel

1. Import the GitHub repo.
2. **Root Directory:** `text-editor-options/tiptap/frontend`
3. Framework: Vite (auto).
4. Environment variable:
   - `VITE_API_BASE` = your Railway URL (e.g. `https://xxxx.up.railway.app`) — **no trailing slash**
5. Deploy.

If you use TipTap Pro packages, also set `TIPTAP_PRO_TOKEN` for install (or commit a CI `.npmrc` carefully / use Vercel install env).
