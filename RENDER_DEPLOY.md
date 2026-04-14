# EduAdapt Deployment Checklist (Render + PostgreSQL + Vercel)

This guide deploys:

- **Backend (FastAPI)** on **Render** (Web Service)
- **Database (PostgreSQL)** on **Render** (Managed PostgreSQL)
- **Frontend (Next.js)** on **Vercel**

You will end up with:

- A **public website link** (Vercel)
- A **persistent production database** (Render Postgres)

---

## Before you start

- Push your project to **GitHub** (Render/Vercel will deploy from it)
- Make sure these files exist in your repo root:
  - `main.py`
  - `requirements.txt`

---

## 1) Create a Render Web Service (Backend)

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repo and select the `eduadapt` repository
3. Configure:
   - **Environment**: `Python`
   - **Region**: choose closest
   - **Branch**: `main` (or your branch)
4. Build & Start:
   - **Build Command** (optional): leave blank (Render will install from `requirements.txt`)
   - **Start Command**:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Click **Create Web Service**

---

## 2) Set up PostgreSQL on Render

1. Render Dashboard → **New** → **PostgreSQL**
2. Choose:
   - Name: `eduadapt-db` (any name is fine)
   - Region: same as your backend (recommended)
3. Click **Create Database**

When it finishes, you’ll see connection info including a **Database URL**.

---

## 3) Configure `DATABASE_URL` (Backend)

1. Open your Render **Web Service** (backend)
2. Go to **Environment** (Environment Variables)
3. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: paste the Postgres URL from your Render DB

Notes:
- If your URL starts with `postgres://...`, that’s OK (the app normalizes it).
- Keep it secret. Do **not** commit it to GitHub.

---

## 4) Configure `EDUADAPT_CORS_ORIGINS` (Backend)

This controls which website is allowed to call your API from a browser.

1. In Render backend → **Environment Variables**, add:
   - **Key**: `EDUADAPT_CORS_ORIGINS`
   - **Value**: your Vercel site URL (example):
     - `https://eduadapt.vercel.app`

Important:
- Use the **exact** Vercel URL (including `https://`)
- No trailing slash

If you don’t have the Vercel URL yet, you can set it later and redeploy.

---

## 5) Deploy backend with Uvicorn (Render)

Your backend should already be using this start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

After you add environment variables, Render will usually redeploy automatically.
If not, click **Manual Deploy** → **Deploy latest commit**.

---

## 6) Deploy frontend on Vercel (Next.js)

1. Go to Vercel Dashboard → **Add New** → **Project**
2. Import the same GitHub repository
3. Set:
   - **Root Directory**: `web`
4. Click **Deploy**

After deploy, Vercel shows your site URL like:
- `https://your-project.vercel.app`

---

## 7) Set `NEXT_PUBLIC_API_URL` (Frontend)

1. Vercel → your project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: your Render backend base URL (example):
     - `https://your-backend.onrender.com`

Important:
- Use **https**
- No trailing slash

3. Redeploy:
   - Vercel → **Deployments** → **Redeploy** (or push a new commit)

---

## 8) Verify the `/health` endpoint (Backend)

After backend deploy, open:

- `https://YOUR-RENDER-BACKEND-URL/health`

Expected response:

```json
{ "status": "ok" }
```

If `/health` fails:
- Check Render logs (backend → **Logs**)
- Confirm `DATABASE_URL` is set
- Confirm the start command is exactly the uvicorn command above

---

## Quick “is everything wired correctly?” test

1. Backend health works:
   - `GET /health` → `{ "status": "ok" }`
2. Frontend loads:
   - Open your Vercel site
3. Frontend can call backend:
   - Try registering a student (if it errors, check `NEXT_PUBLIC_API_URL` and `EDUADAPT_CORS_ORIGINS`)

