## Conecthus — Task Manager

Full-stack task management application built for the **AV_DEV_SENIOR** challenge:

* **Web:** React + Vite.js + TypeScript + Redux Toolkit (SPA)
* **Mobile:** React Native (Expo SDK 57)
* **Backend:** NestJS + Prisma + PostgreSQL
* **Cache:** Redis
* **Messaging:** MQTT (real-time notifications)
* **Containers:** Docker Compose (one command to run everything)

...

## Demo

Aplicação Web publicada: https://conecthus.patriatechnology.com

* **Web:** SPA pública; cadastro e login são auto-atendidos (crie uma conta na primeira visita).
* **Backend:** API REST + Swagger em `/api/docs` quando rodando via Docker Compose.
* **Mobile:** roda separadamente via Expo Go (SDK 57) apontando para o backend.

> Validação 2026-09-21: a Web, o Swagger (`/api/docs`) e a API (`/api/*`) respondem
> no domínio público (**HTTP 200**; `/api/tasks` sem token retorna **401**). A
> validação completa também pode ser feita localmente via Docker Compose. Não há
> credenciais de demonstração públicas.

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

## Requisitos do desafio

| Requisito                          | Implementação                                             | Local                                                                |
| ---------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| Autenticação                       | JWT (cadastro/login), guard global + `@Public()`          | `backend/src/auth`; `web/src/auth`, `web/src/api/auth.ts`; `mobile/src/auth` |
| Tarefas (criar/ver/editar/concluir/excluir) | REST + Prisma                                      | `backend/src/tasks`                                                   |
| Filtros (status, data), busca textual e paginação | `TaskQueryDto` + `TasksService.findAll`      | `backend/src/tasks/dto/task-query.dto.ts`, `backend/src/tasks/tasks.service.ts` |
| Isolamento por usuário              | `userId` obrigatório no `WHERE`                           | `TasksService` (coberto no e2e)                                       |
| Cache Redis                         | Lista + perfil, TTL 60s, invalidação pós-mutação          | `CacheModule` (`app.module.ts`); `tasks.service.ts`, `users.service.ts` |
| Notificações em tempo real (MQTT)   | Publicação em `notifications/{userId}`                    | `backend/src/mqtt/mqtt.service.ts`; `web/src/mqtt`, `mobile/src/mqtt` |
| Web                                 | React 19 + Vite + TypeScript + Redux Toolkit, responsivo  | `web/` (`web/src/pages`, `web/src/features`)                          |
| Mobile                              | Expo SDK 57 / React Native + AsyncStorage                  | `mobile/` (`mobile/src/screens`)                                     |
| Validação                           | Backend: class-validator + `ValidationPipe`; Web: zod + react-hook-form | `backend/src/**/dto`, `backend/src/setup-app.ts`; `web/src/features/*Schema.ts` |
| Banco de dados                      | PostgreSQL 16 + Prisma 7                                   | `backend/prisma` (schema + migrations)                                |
| Documentação da API                 | Swagger em `GET /api/docs`                                | `backend/src/setup-app.ts`                                            |
| Testes unitários                    | Backend 26, Web 77, Mobile 89; thresholds de cobertura 70% configurados para Web e Mobile (backend sem threshold) | `backend/src/**/*.spec.ts`; `web/src/**/*.spec.*`; `mobile/src/**/*.test.*` |
| Testes de integração                | e2e: auth, CRUD, cache, MQTT, ownership — 12 casos        | `backend/test/app.e2e-spec.ts`                                        |
| CI/CD e deploy                      | GitHub Actions (push p/ `main`): install, `prisma generate`, build backend/web, `docker compose config`, deploy SSH + `compose up` com healthchecks | `.github/workflows/deploy-production.yml`                             |
| Docker / Compose                    | Postgres 16, Redis 7, Mosquitto 2, backend, nginx — healthchecks | `docker-compose.yml` + `backend/Dockerfile`, `web/Dockerfile`   |

## Guia rápido de avaliação

1. Suba tudo: `docker compose up --build -d`.
2. Abra a Web em http://localhost:5173 (ou use a demo pública).
3. Cadastre-se e faça login.
4. Crie uma tarefa e verifique a notificação em tempo real.
5. Edite, conclua e exclua a tarefa.
6. Teste filtros (status/período), busca textual e paginação.
7. Consulte o Swagger (compose: http://localhost:3005/api/docs; `npm run start:dev`: http://localhost:3000/api/docs).
8. Rode os testes: backend `npm test` e `npm run test:e2e`; web `npm test`; mobile `npm test`.
9. Revise `docker-compose.yml` (infra, portas, healthchecks).
10. Mobile: `cd mobile && npm start` (Expo Go SDK 57) apontando para o backend.

## Limitações conhecidas

* Busca textual é `ILIKE` parcial — não tolera acentos/typos e não ordena por relevância (`pg_trgm` não adotado; ver [Busca textual](#busca-textual)).
* A pipeline de CI builda e faz deploy, mas **não executa a suíte de testes** (validar localmente).
* Backend não possui threshold de cobertura configurado (apenas Web e Mobile).
