# TipTap Manuscript Demo

Split for separate hosting:

| Folder | Host | Role |
|--------|------|------|
| [`frontend/`](./frontend) | **Vercel** | Vite + React TipTap editor (`dist`) |
| [`backend/`](./backend) | **Railway** | Express + MongoDB API |

```
Browser (Vercel)  --VITE_API_BASE-->  API (Railway)  -->  MongoDB Atlas
```

## Quick local

```bash
# once
npm run install:all

# backend env
cp backend/.env.example backend/.env   # set MONGODB_URI

# both
npm run dev:all
```

- Frontend: http://localhost:5173  
- Backend:  http://127.0.0.1:8787/api/health  

Locally leave `frontend` `VITE_API_BASE` empty (Vite proxies `/api` → backend).

## Deploy

### 1. Railway (backend)

1. Root directory: `text-editor-options/tiptap/backend`
2. Env: `MONGODB_URI`, `MONGODB_DB`, `CORS_ORIGIN=https://YOUR-VERCEL-APP.vercel.app`
3. Note the public API URL

### 2. Vercel (frontend)

1. Root directory: `text-editor-options/tiptap/frontend`
2. Env: `VITE_API_BASE=https://YOUR-RAILWAY-APP.up.railway.app` (no trailing slash)
3. Deploy

Set Railway `CORS_ORIGIN` to the Vercel URL (update if preview URLs need access too — comma-separated).

## Notes

- Demo uses a random `localStorage` user id (no login). Cross-device sync needs real auth later.
- Dictation needs Chrome/Edge + mic permission (browser Web Speech API).
# tiptap-editor-saving-
