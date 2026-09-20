# Mobile — Expo + React Native

App **Expo SDK 57** (React 19, React Native 0.86, TypeScript 6) para o gerenciador de tarefas Conecthus. Telas nativas com **React Navigation**, **axios**, **AsyncStorage** e **MQTT over WebSocket** em tempo real, implementando os mesmos fluxos funcionais do frontend web.

## Stack

| Concern      | Technology                                     |
| ------------ | ---------------------------------------------- |
| Runtime      | Expo SDK 57 + React Native 0.86 / React 19     |
| Navegação    | @react-navigation/native + native-stack        |
| HTTP         | axios (`/api`, JWT via interceptor)            |
| Persistência | @react-native-async-storage/async-storage      |
| Real-time    | mqtt.js (WebSocket → `notifications/{userId}`) |
| Testes       | jest-expo + @testing-library/react-native      |

## Estrutura

```text id="q2s7kd"
src/
├── App.tsx                     # NavigationContainer + AuthProvider + Stack
├── config.ts                   # API_BASE_URL / MQTT_URL (10.0.2.2 no Android)
├── theme.ts                    # cores, espaçamento, labels de status
├── types.ts                    # User, Task, DTOs
├── api/                        # client (axios + JWT), auth, tasks (buildTaskQuery)
├── auth/                       # storage (AsyncStorage + token em memória), AuthContext
├── navigation/types.ts         # RootStackParamList
├── components/                 # Button, TextField, TaskCard, TaskFilters, StatusBadge, NotificationOverlay
├── mqtt/useNotifications.ts    # mqtt.connect + parseNotification + emitTasksChanged
├── events.ts                   # DeviceEventEmitter wrapper (TASKS_CHANGED_EVENT)
└── screens/                    # Login, Register, Tasks, TaskForm (new/edit), TaskDetail
```

## Scripts

| Comando                 | Descrição                                  |
| ----------------------- | ------------------------------------------ |
| `npm start`             | `expo start` (QR para Expo Go)             |
| `npm run android`       | `expo start --android`                     |
| `npm run ios`           | `expo start --ios`                         |
| `npm run typecheck`     | `tsc --noEmit`                             |
| `npm test`              | jest-expo + RNTL                           |
| `npm run test:coverage` | `jest --coverage` (threshold global ≥ 70%) |

## Ambiente

Copie `.env.example` para `.env` (opcional). Em produção o `.env` é lido via `EXPO_PUBLIC_*` no build:

```bash id="m7w2pv"
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api    # emulador Android -> host

# Para device físico, use o IP da sua máquina:
# EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/api

EXPO_PUBLIC_MQTT_URL=ws://10.0.2.2:8083

# EXPO_PUBLIC_MQTT_URL=ws://192.168.0.10:8083
```

Sem `.env`, o default é `http://<host>:3000/api` e `ws://<host>:8083`, onde `<host>` é `10.0.2.2` no Android e `localhost` nas demais plataformas.

## Rodando local

```bash id="z8q4tx"
# 1. Suba o backend + infra (na raiz)
docker compose up --build -d

# ou local:
# cd backend && npm run start:dev
# (requer Postgres/Redis/Mosquitto)

# 2. Mobile
cd mobile

npm install
cp .env.example .env       # ajuste o IP se for device físico

npm start                  # escaneie o QR no Expo Go (SDK 57)

# Testes
npm test
npm run test:coverage
npm run typecheck
```

> **Expo Go SDK 57**: exige `expo@57`, `react-native@0.86` e `jest-expo@57` — versões fixadas no `package.json`. `npx expo install` garante compatibilidade de `react-native-screens` e `safe-area-context`.

## Fluxos

* **Auth:** `AuthContext` carrega a sessão do `AsyncStorage` no mount (`loadSession` → `setToken` em memória + `setUser`). `login`/`register` chamam `/auth/*`, persistem via `persistSession` e atualizam o token em memória, usado pelo interceptor do axios. `logout` chama `removeSession`.

* **Tasks:** `TasksScreen` busca via `listTasks` (filtros `status`/`search`, paginação), usando `FlatList`, `TaskFilters` e `NotificationOverlay`. Mudanças recebidas via MQTT disparam `TASKS_CHANGED_EVENT` (`DeviceEventEmitter`), fazendo a tela recarregar a lista.

* **Notificações:** `useNotifications(userId)` conecta em `MQTT_URL` (`mqtt.connect`), assina `notifications/{userId}`, interpreta o payload JSON e expõe `notifications` + `dismiss`.
