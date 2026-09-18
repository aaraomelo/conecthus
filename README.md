# Conecthus — Task Manager

Full-stack task management application built for the **AV_DEV_SENIOR** challenge:

- **Web:** React + Vite.js (TypeScript, SPA)
- **Mobile:** React Native (Expo SDK 57)
- **Backend:** NestJS + Prisma + PostgreSQL
- **Cache:** Redis
- **Messaging:** MQTT (real-time notifications)
- **Containers:** Docker Compose (one command to run everything)

```text
                    ┌───────────────┐
                    │ React / Vite  │
                    │    (Web)      │
                    └───────┬───────┘
                            │ REST + JWT
                    ┌───────▼───────┐
                    │    NestJS     │
                    │               │
                    │ Auth / Tasks  │
                    │ Cache / MQTT  │
                    └──┬────┬───┬───┘
                       │    │   │
              ┌────────┘    │   └────────┐
              ▼             ▼            ▼
        PostgreSQL       Redis        MQTT
          (Prisma)      (cache)     (broker)

React Native
     │
     ├── REST ───────► NestJS
     │
     └── MQTT ◄─────── NestJS/Broker
```

## Repository layout

```text
.
├── backend/            # NestJS API (Prisma, JWT, Redis cache, MQTT)
├── web/                # React + Vite frontend (nginx)
├── mobile/             # React Native app (Expo SDK 57, React Navigation)
├── mosquitto/          # MQTT broker config (mqtt + websockets)
└── docker-compose.yml  # postgres + redis + mqtt + backend + frontend
```

## Quick start

```bash
docker compose up --build
```

This starts (health-checked in order):

- `frontend`  → http://localhost:5173
- `backend`   → http://localhost:3000/api (Swagger: http://localhost:3000/api/docs)
- `postgres`  → localhost:5432
- `redis`     → localhost:6379
- `mqtt`      → localhost:1883 (mqtt) · localhost:8083 (websockets)

> O frontend é servido por nginx no mesmo origin (`:5173`), que faz proxy de
> `/api` para o backend e de `/mqtt` (WebSocket) para o Mosquitto — sem CORS.

## Development

### Backend (see [backend/README.md](backend/README.md))

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run start:dev
```

### Frontend (see [web/README.md](web/README.md))

```bash
cd web
npm install
npm run dev        # http://localhost:5173 (proxy de /api e /mqtt)
```

### Mobile (see [mobile/README.md](mobile/README.md))

```bash
cd mobile
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_* se for device físico
npm start              # Expo Go (SDK 57) — escaneie o QR
```

### Tests

```bash
cd backend
npm test           # unit tests (no infra required)
npm run test:e2e   # integration tests (requires docker compose infra up)

cd web
npm test           # unit tests (Vitest + Testing Library)
npm run test:coverage   # with coverage (must keep ≥ 70%)

cd mobile
npm test           # unit tests (jest-expo + RNTL)
npm run test:coverage   # with coverage (must keep ≥ 70%)
```

## Architecture decisions

> **Authentication (JWT):** the API is stateless. Tokens are verified by a global
> `JwtAuthGuard`; endpoints opt out with `@Public()` (only `auth/*`).
>
> **Cache invalidation:** task lists and user profiles are cached in Redis. List cache
> keys are tracked per user and deleted after any mutation (`POST/PATCH/DELETE`),
> preventing stale lists. Profiles are refreshed on update.
>
> **Messaging (MQTT):** MQTT delivers real-time notifications for task mutations on
> `notifications/{userId}`. PostgreSQL remains the source of truth for persistent data.
>
> **Persistence (Prisma):** Prisma 7 provides type-safe access and schema migrations
> (`prisma migrate`), applied automatically on container startup.
>
> **Containers (Docker Compose):** all infrastructure is orchestrated through a single
> `docker-compose.yml` with health checks and `depends_on` ordering.
>
> **Frontend (React + Vite):** a single-origin SPA served by nginx, which proxies `/api`
> (REST) and `/mqtt` (WebSockets) to the backend/Mosquitto. It keeps the JWT in
> `localStorage`, subscribes to `notifications/{userId}` for real-time updates and
> re-fetches the task list when mutation notifications arrive.
>
> **Mobile (Expo SDK 57):** React Native com React Navigation (stack), axios com
> interceptor de JWT (token em memória + `AsyncStorage` para persistência) e MQTT
> via WebSocket (`notifications/{userId}`). `TasksScreen` consome `listTasks` com
> filtros, `FlatList` e `NotificationOverlay`; mutações disparam `TASKS_CHANGED_EVENT`
> (DeviceEventEmitter) que recarrega a lista.

## Requirements coverage

| Requirement                 | Where                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Register / login            | `backend/src/auth` + `web/src/pages/*` + `mobile/src/screens/Login*|Register*`               |
| Protected routes            | Global `JwtAuthGuard` + `@Public()`; `ProtectedRoute`/`GuestRoute` (web) + Stack condicional (mobile) |
| Task CRUD + filters         | `backend/src/tasks`; `web/src/pages/TasksPage` + `TaskFilters`; `mobile/src/screens/Tasks*` + `TaskFilters` |
| Redis cache + invalidation  | `CacheModule` + `TasksService`/`UsersService` key tracking/invalidation                    |
| MQTT notifications          | `MqttService.notify` → `notifications/{userId}`; `web/src/mqtt` + `mobile/src/mqtt` (overlay/toasts) |
| Swagger documentation       | `@nestjs/swagger` at `/api/docs`                                                           |
| Unit tests                  | Backend: 26. Web: 46. Mobile: 89 (jest-expo + RNTL, ≥ 70% coverage em todos) |
| Integration tests           | `backend/test/app.e2e-spec.ts` (auth, CRUD, cache, MQTT, ownership)                        |
| Docker / Compose            | `Dockerfile`s + nginx + `docker-compose.yml`                                               |
| README / Git                | This file + clean commit history                                                           |

## Minimum versions

- Node.js 20.18+ (24 recommended)
- Docker Engine 24+ / Docker Compose v2