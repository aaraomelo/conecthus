## Conecthus — Task Manager

Full-stack task management application built for the **AV_DEV_SENIOR** challenge:

* **Web:** React + Vite.js + TypeScript + Redux Toolkit (SPA)
* **Mobile:** React Native (Expo SDK 57)
* **Backend:** NestJS + Prisma + PostgreSQL
* **Cache:** Redis
* **Messaging:** MQTT (real-time notifications)
* **Containers:** Docker Compose (one command to run everything)

...

## Architecture decisions

> **Authentication (JWT):** the API is stateless. Tokens are verified by a global
> `JwtAuthGuard`; endpoints opt out with `@Public()` (only `auth/*`).

> **Frontend state management (Redux Toolkit):** the web application uses Redux Toolkit
> for centralized client state, with dedicated slices and selectors for authentication,
> tasks, and notifications. The existing `AuthContext` acts as the authentication
> integration layer, while MQTT notifications are dispatched into the Redux notification
> state.

> **Cache invalidation:** task lists and user profiles are cached in Redis. List cache
> keys are tracked per user and deleted after any mutation (`POST/PATCH/DELETE`),
> preventing stale lists. Profiles are refreshed on update.

> **Messaging (MQTT):** MQTT delivers real-time notifications for task mutations on
> `notifications/{userId}`. PostgreSQL remains the source of truth for persistent data.

> **Persistence (Prisma):** Prisma 7 provides type-safe access and schema migrations
> (`prisma migrate`), applied automatically on container startup.

> **Containers (Docker Compose):** all infrastructure is orchestrated through a single
> `docker-compose.yml` with health checks and `depends_on` ordering.

> **Frontend (React + Vite + Redux Toolkit):** a single-origin SPA served by nginx,
> which proxies `/api` (REST) and `/mqtt` (WebSockets) to the backend/Mosquitto.
> Redux Toolkit centralizes authentication, task, and notification state through
> dedicated slices and selectors. The JWT is persisted in `localStorage`, while MQTT
> notifications are integrated into the notification state and task updates trigger
> the appropriate task refresh flow.

> **Mobile (Expo SDK 57):** React Native com React Navigation (stack), axios com
> interceptor de JWT (token em memória + `AsyncStorage` para persistência) e MQTT
> via WebSocket (`notifications/{userId}`). `TasksScreen` consome `listTasks` com
> filtros, `FlatList` e `NotificationOverlay`; mutações disparam
> `TASKS_CHANGED_EVENT` (DeviceEventEmitter) que recarrega a lista.

## Busca textual

> **Decisão (busca textual):** a listagem de tarefas busca por `search` via Prisma
> `contains` + `mode: 'insensitive'`, o que gera `ILIKE ('%' || $termo || '%')` sobre
> `title` e `description`, sempre com valores como parâmetros vinculados. A consulta
> mantém `userId` obrigatório (isolamento por usuário), filtros por `status`/`dueDate`,
> paginação e cache Redis. `pg_trgm` foi investigado experimentalmente, avaliando GIN/GiST,
> `similarity`, `word_similarity`, acentuação e planos de execução. A decisão é **não
> adotar `pg_trgm` neste estágio**: o volume atual não justifica a complexidade adicional.
> A extensão permanece como possibilidade futura caso escala ou qualidade da busca
> passem a exigir.

| Estratégia                  | Situação    | Motivo                                                     |
| --------------------------- | ----------- | ---------------------------------------------------------- |
| Prisma `contains` / ILIKE   | Atual       | Simples e suficiente para o volume atual                   |
| pg_trgm + GIN               | Futuro      | Considerar se a escala tornar o Seq Scan relevante         |
| pg_trgm + similarity        | Futuro      | Considerar se houver necessidade de typo/ranking           |
| pgvector                    | Não adotado | Sem necessidade de busca semântica neste estágio           |

> **Escopo das tecnologias de busca:** `ILIKE` → substring/case-insensitive;
> `pg_trgm` → similaridade textual/fuzzy matching — **não é busca semântica**;
> `pgvector` → embeddings/busca semântica.

> **Aprendizado técnico:** `pg_trgm` foi avaliado fora de produção, incluindo testes com
> PostgreSQL real e comparação de planos de execução. Os resultados indicaram potencial
> de ganho em volumes maiores (em um experimento sintético com 100k registros o índice
> GIN reduziu o plano observado de ~83 ms para ~22 ms — valores apenas indicativos, não
> um benchmark de produção), mas não justificaram a complexidade adicional para o cenário
> atual.

## Requirements coverage

| Requirement                | Where                                                                                                       |           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | --------- |
| Register / login           | `backend/src/auth` + `web/src/pages/*` + `mobile/src/screens/Login*                                         | Register` |
| Protected routes           | Global `JwtAuthGuard` + `@Public()`; `ProtectedRoute`/`GuestRoute` (web) + Stack condicional (mobile)       |           |
| Task CRUD + filters        | `backend/src/tasks`; `web/src/pages/TasksPage` + `TaskFilters`; `mobile/src/screens/Tasks*` + `TaskFilters` |           |
| Redis cache + invalidation | `CacheModule` + `TasksService`/`UsersService` key tracking/invalidation                                     |           |
| MQTT notifications         | `MqttService.notify` → `notifications/{userId}`; `web/src/mqtt` + `mobile/src/mqtt` (overlay/toasts)        |           |
| Redux Toolkit              | `web/src/app/store.ts` + `web/src/features/{auth,tasks,notifications}`                                      |           |
| Swagger documentation      | `@nestjs/swagger` at `/api/docs`                                                                            |           |
| Unit tests                 | Backend: 26. Web: 46. Mobile: 89 (jest-expo + RNTL, ≥ 70% coverage em todos)                                |           |
| Integration tests          | `backend/test/app.e2e-spec.ts` (auth, CRUD, cache, MQTT, ownership)                                         |           |
| Docker / Compose           | `Dockerfile`s + nginx + `docker-compose.yml`                                                                |           |
| README / Git               | This file + clean commit history                                                                            |           |
