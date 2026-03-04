# Render + Vercel Quick Deploy

This repo is pre-configured with:
- `render.yaml` (backend service blueprint)
- `apps/frontend/vercel.json` (SPA rewrite config)

## 1) Push latest code to GitHub

```powershell
git add .
git commit -m "deploy config: render + vercel"
git push origin main
```

## 2) Deploy backend on Render

1. Render Dashboard -> New -> Blueprint.
2. Select your GitHub repo.
3. Render reads `render.yaml` automatically.
4. Open created service -> Environment and set:
   - `PG_CONNECTION_STRING=postgresql://postgres:YOUR_DB_PASSWORD@db.ijnobbackjggdswsfxnw.supabase.co:5432/postgres?sslmode=require`
   - `API_KEY=<your_app_api_key>`
   - `CORS_ORIGINS=https://YOUR_VERCEL_DOMAIN`
5. Trigger deploy.
6. Verify health URL:
   - `https://YOUR_RENDER_DOMAIN/health` should return `{"status":"ok"}`

## 3) Apply schema to Supabase (one-time)

```powershell
Get-Content apps\backend\sql\postgres_schema.sql | psql "postgresql://postgres:YOUR_DB_PASSWORD@db.ijnobbackjggdswsfxnw.supabase.co:5432/postgres?sslmode=require"
```

## 4) Deploy frontend on Vercel

1. Vercel Dashboard -> Add New Project -> Import GitHub repo.
2. Set Root Directory = `apps/frontend`.
3. Set environment variables:
   - `VITE_API_URL=https://YOUR_RENDER_DOMAIN`
   - `VITE_API_KEY=<same_as_backend_API_KEY>`
4. Deploy.

## 5) Final CORS update

After Vercel gives final URL (for example `https://hotel-pos.vercel.app`):

1. Edit Render env `CORS_ORIGINS`:
   - `https://hotel-pos.vercel.app`
2. Redeploy Render service.

## 6) Test from phone (any network)

1. Open Vercel URL on mobile.
2. Confirm app loads data and actions work.
