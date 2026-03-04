# Railway Deploy Checklist

This repo is a monorepo. Deploy backend from `apps/backend`.

## 1) Create backend service

1. Open Railway dashboard.
2. Click `New Project` -> `Deploy from GitHub repo`.
3. Select repo `Tarmaleamol/hotel_pr`.
4. Open the created service settings and set:
   - `Root Directory`: `apps/backend`
   - `Build Command`: `npm ci && npm run build`
   - `Start Command`: `npm run start`

## 2) Add backend environment variables

Set these in Railway service variables:

- `SYSTEM_MODE=CENTRAL_MODE`
- `PG_CONNECTION_STRING=postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require`
- `SYNC_INTERVAL_MS=10000`
- `API_KEY=<your_app_api_key>`
- `CORS_ORIGINS=https://YOUR_VERCEL_DOMAIN,http://localhost:5173,http://localhost:5175`
- `TRUST_PROXY=true`

Do not set fixed `PORT`. Railway provides `PORT` automatically.

## 3) Verify backend

1. Deploy the service.
2. Open Railway-generated domain:
   - `https://<railway-domain>/health`
3. Expected response:
   - `{"status":"ok"}`

## 4) Apply schema in Supabase (one-time)

Run on your machine:

```powershell
Get-Content d:\hotel_pr\apps\backend\sql\postgres_schema.sql | psql "postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
```

## 5) Frontend deploy (Vercel)

Set Vercel project root to `apps/frontend`.

Vercel env vars:

- `VITE_API_URL=https://<railway-domain>`
- `VITE_API_KEY=<same_backend_API_KEY>`

Redeploy frontend after setting vars.
