# Hotel/Restaurant POS Monorepo

Full-stack POS with NestJS backend, React frontend, SQLite/PostgreSQL modes, Socket.io real-time updates, and sync engine.

## Structure
- `apps/backend` NestJS API + WebSocket + sync worker
- `apps/frontend` React + TypeScript POS and Kitchen UI
- `docs` architecture/API/deployment notes

## Run
1. Backend
```bash
cd apps/backend
npm install
npm run start:dev
```
2. Frontend
```bash
cd apps/frontend
npm install
npm run dev
```
