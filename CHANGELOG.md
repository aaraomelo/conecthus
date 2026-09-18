# Changelog

## [Unreleased] - 2026-09-18

### Backend
- NestJS 12 + Prisma 7 + PostgreSQL 16, Redis (cache-manager) e MQTT (Mosquitto)
- `JwtAuthGuard` global + `@Public()` para `auth/*`; `@CurrentUser()` para `users/me` e `tasks/*`
- `TasksService` com cache de listagem (`tasks:list:*`), `trackListKey`/`invalidateTasksCache` e `MqttService.notify` (`TASK_CREATED/UPDATED/DELETED` em `notifications/{userId}`)
- `setupApp` centralizado (`api` prefix, `ValidationPipe`, Swagger em `/api/docs`) reutilizado por `main.ts` e `test/app.e2e-spec.ts`
- 26 testes unitários (Vitest) + 11 testes e2e (supertest + MQTT)
- `docker-entrypoint.sh` executa `prisma migrate deploy` antes de `node dist/main.js`; `Dockerfile` multi-stage (node:24-alpine)

### Web
- React 19 + Vite 8 + TypeScript, `react-router-dom` v7, `axios` (interceptor JWT) e `mqtt` (WebSocket)
- `AuthContext` + `localStorage`, `ProtectedRoute`/`GuestRoute`, `Layout`, `TaskCard`, `TaskFilters`, `StatusBadge`, `NotificationToast`
- `useNotifications` (`ws://.../mqtt` → `notifications/{userId}`) dispara `TASKS_CHANGED_EVENT` e recarrega a lista
- `vite.config.ts` com proxy `/api`→3000 e `/mqtt`→8083, Vitest + coverage ( thresholds 70% )
- 46 testes (11 arquivos), cobertura 83/75/81/86; `tsc -b && vite build` ok
- `Dockerfile` multi-stage `node:24-alpine` → `nginx:1.27-alpine` (`nginx.conf` com proxy `/api` e `/mqtt` + fallback SPA)

### Mobile
- Expo SDK 57 (React 19, RN 0.86, TS 6) + `@react-navigation/native-stack` + `axios` + `@react-native-async-storage/async-storage` + `mqtt`
- `config.ts` com `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_MQTT_URL` (`10.0.2.2` no Android) e `theme.ts`/`types.ts` espelhando o web
- `storage.ts` (token em memória + `AsyncStorage`), `AuthContext` com `initializing`, `events.ts` (`DeviceEventEmitter`)
- `useNotifications` (`mqtt.connect`) + `parseNotification` + `NotificationOverlay` (dismiss)
- Screens: `LoginScreen`, `RegisterScreen`, `TasksScreen` (FlatList + filtros + paginação + overlay), `TaskFormScreen` (create/edit), `TaskDetailScreen`
- `App.tsx` com `SafeAreaProvider` → `AuthProvider` → `NavigationContainer` → Stack condicional
- jest-expo + RNTL v14 (render assíncrono), `setup.ts` (`IS_REACT_ACT_ENVIRONMENT`) e `setupAfterEnv.ts` (AsyncStorage mock); 89 testes / 18 suítes, cobertura 83/76/75/86, `tsc --noEmit` ok
- Correção de warnings `Stack.Screen component={() => null}` → `const Dummy = () => null`

### Infra
- `docker-compose.yml` com `postgres` (16-alpine, healthcheck `pg_isready`), `redis` (7-alpine, `redis-cli ping`), `mqtt` (eclipse-mosquitto:2, listeners 1883/8083 + healthcheck `mosquitto_sub`), `backend` (healthcheck `wget /api/docs`, depende de `service_healthy` de postgres/redis/mqtt) e `frontend` (5173:80, depende de `backend` healthy)
- `mosquitto/mosquitto.conf` com listeners `1883` (mqtt) e `8083` (websockets) + `allow_anonymous true`
- `web/nginx.conf` com `proxy_pass` para `/api/` → `backend:3000` e `/mqtt` (Upgrade) → `mosquitto:8083`

### Docs
- READMEs (raiz, backend, web, mobile) com stack, estrutura, env, scripts, Docker e cobertura de requisitos
- `.env.example` para backend, web e mobile
- Swagger em `http://localhost:3000/api/docs` (`DocumentBuilder` + `addBearerAuth`)
