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

If this GitHub repo **is** the `tiptap` folder (has `frontend/` + `backend/` at root):

1. Leave Root Directory empty (repo root).
2. `railway.toml` installs/starts **backend only** (no Vite).
3. Env: `MONGODB_URI`, `MONGODB_DB`, `CORS_ORIGIN=https://YOUR-VERCEL-APP.vercel.app`
4. Redeploy.

If the repo is the full Storygroove monorepo, set Root Directory to `text-editor-options/tiptap/backend` instead.

### 2. Vercel (frontend)

1. Root directory: `text-editor-options/tiptap/frontend`
2. Env: `VITE_API_BASE=https://YOUR-RAILWAY-APP.up.railway.app` (no trailing slash)
3. Deploy

Set Railway `CORS_ORIGIN` to your Vercel URL(s), e.g.  
`https://tiptap-editor-saving-git-main-sjinnovation.vercel.app`  
(API also allows `https://*.vercel.app` previews.) If Network shows **CORS error** on `PUT .../me`, this variable is wrong or missing — then UI shows **Offline — saved locally**.

## Notes

- Demo uses a random `localStorage` user id (no login). Cross-device sync needs real auth later.
- Dictation needs **Chrome/Edge**, **HTTPS** (Vercel URL), and mic permission. It does **not** run on the Railway API URL (API only).
- If Railway logs show `TLS` / `ReplicaSetNoPrimary`: Atlas → **Network Access** → allow `0.0.0.0/0` (or Railway IPs), then redeploy.

## Atlas checklist (Railway Mongo crash)

1. Atlas → Network Access → **Allow Access from Anywhere** `0.0.0.0/0`
2. Railway Variables → `MONGODB_URI` = full `mongodb+srv://.../?retryWrites=true&w=majority`
3. Redeploy API → open `/api/health`
