# Supabase Deployment Checklist

This checklist is for this repository layout:
- Cloud backend: `apps/backend` (NestJS)
- Desktop app on LAN: `apps/frontend` + `apps/frontend/electron`
- Mobile web: `apps/frontend` static build

## 1) Create Supabase project

1. Create a new Supabase project.
2. Open Project Settings -> Database.
3. Copy the PostgreSQL connection string (pooler, port `6543`) with SSL mode required.
4. Use a strong database password.

## 2) Apply schema to Supabase PostgreSQL

Run from repo root:

```powershell
Get-Content apps\backend\sql\postgres_schema.sql | psql "postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
```

If `psql` is not installed, install PostgreSQL client tools first.

## 3) Configure backend env (cloud server)

Create `apps/backend/.env`:

```env
SYSTEM_MODE=CENTRAL_MODE
PG_CONNECTION_STRING=postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require
SYNC_INTERVAL_MS=10000
PORT=4000

API_KEY=replace_with_a_very_long_random_secret
CORS_ORIGINS=https://pos.yourdomain.com,https://mpos.yourdomain.com,http://192.168.1.11:5175
TRUST_PROXY=true
```

Notes:
- Keep `API_KEY` private.
- `CORS_ORIGINS` must include every browser origin that should access API.
- If backend is behind Nginx/Cloudflare/Render proxy, keep `TRUST_PROXY=true`.

## 4) Configure frontend envs

Create `apps/frontend/.env` for desktop and mobile builds:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_API_KEY=replace_with_same_backend_api_key
```

## 5) Deploy backend (cloud VM / Render / Railway / Fly)

From backend directory:

```powershell
npm ci
npm run build
npm run start
```

Production recommendation:
- Run with process manager (`pm2`, systemd, or platform-managed process).
- Terminate TLS at reverse proxy and expose only HTTPS (`443`).
- Do not expose PostgreSQL credentials to frontend or Electron binaries.

## 6) Deploy mobile web (static hosting)

From frontend directory:

```powershell
npm ci
npm run build
```

Deploy `apps/frontend/dist` to static hosting (Netlify, Cloudflare Pages, Vercel, S3+CloudFront).
Use origin listed in backend `CORS_ORIGINS`.

## 7) Run desktop app on LAN

1. Set `apps/frontend/.env` to cloud API domain.
2. Build or run Electron app on local PCs.
3. Ensure outbound internet to `https://api.yourdomain.com`.

## 8) Security checks (must pass)

1. API call without `x-api-key` returns `401`.
2. API call with valid key succeeds.
3. Socket connection to `/kitchen` without auth key disconnects.
4. Browser request from non-whitelisted origin is blocked by CORS.
5. Supabase password and backend API key are not committed to git.

## 9) Rotation procedure

If a key leaks:
1. Generate a new backend `API_KEY`.
2. Update cloud backend env and restart backend.
3. Update `VITE_API_KEY` in desktop/mobile builds and redeploy.
