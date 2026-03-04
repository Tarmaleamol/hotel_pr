# POS Architecture

## Folder Structure

```text
apps/
  backend/
    src/
      common/
      config/
      database/
      modules/
        audit/
        billing/
        inventory/
        kitchen/
        menu/
        orders/
        printers/
        sync/
        tables/
    sql/
      sqlite_schema.sql
      postgres_schema.sql
  frontend/
    src/
      api/
      pages/
      types/
    electron/
```

## System Modes
- `LOCAL_MODE`: Reads/writes SQLite only.
- `CENTRAL_MODE`: Reads/writes PostgreSQL only.
- `HYBRID_MODE`: Reads/writes SQLite and enqueues row-level sync in `sync_logs` for PostgreSQL background replication.

## Core Tables
- `tables`
- `orders` (UUID PK)
- `order_items`
- `menu_items`
- `inventory`
- `recipes`
- `printers`
- `sync_logs`
- `audit_logs`

All tables include `updated_at` for conflict resolution and sync ordering.

## API Endpoints
- `GET /tables`
- `PATCH /tables/availability`
- `GET /menu-items`
- `POST /menu-items`
- `GET /orders/active`
- `POST /orders`
- `PATCH /orders/:orderId/items`
- `PATCH /orders/:orderId/send-kot`
- `GET /kitchen/queue`
- `PATCH /billing/:orderId/generate`
- `PATCH /billing/:orderId/pay`
- `GET /inventory`
- `PATCH /inventory`
- `GET /printers`
- `POST /printers/route`
- `POST /sync/run`

## WebSocket
Namespace: `/kitchen`
- `order.updated` emitted for create/update/recovery.
- `order.kot_sent` emitted when KOT is sent.

Kitchen UI subscribes for real-time queue updates.

## KOT + Billing Rules
- Order statuses: `CREATED`, `KOT_SENT`, `UPDATED`, `BILL_GENERATED`, `PAID`.
- Bill generation allowed only after KOT (`KOT_SENT`/`UPDATED`).
- Table set free after payment success.
- Inventory deducted when KOT is confirmed.

## Sync Engine
- Background worker scans `sync_logs` where status is `PENDING`.
- Upsert to PostgreSQL by row ID.
- Conflict policy: `last update wins` through `ON CONFLICT ... DO UPDATE` with latest `updated_at` data source.
- Retries increment in `sync_logs.retries`; failed rows retain error reason.

## Failure Recovery
- On backend restart, all orders with `status != PAID` are loaded.
- Recovered orders are broadcast to kitchen via socket.
- Mutations are executed inside SQL transactions at service level (write + recompute + audit chain).

## Printing
- `printers` table supports `connection_type` and `address`.
- Route by `route_type = KOT|BILL`.
- Works for single or dual printer setups, including network printers.

## Deployment
- Backend:
  - On-prem local server (`LOCAL_MODE` or `HYBRID_MODE`).
  - Cloud server (`CENTRAL_MODE`).
- Frontend:
  - Web app via Vite build.
  - Desktop via Electron wrapper (`apps/frontend/electron/main.cjs`).
