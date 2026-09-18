# Frontend — React + Vite

Single-origin SPA for the Conecthus task manager. Built with **React 19**, **Vite 8**
(TypeScript), **react-router**, **axios** and **MQTT over WebSocket** for real-time
notifications.

## Stack

| Concern        | Technology                                   |
| -------------- | -------------------------------------------- |
| Build          | Vite 8 + TypeScript                          |
| UI             | React 19 (functional components + hooks)     |
| Routing        | react-router-dom v7                          |
| HTTP           | axios (base `/api`, JWT via interceptor)     |
| Real-time      | mqtt.js (WebSocket → `notifications/{userId}`) |
| Styling        | SCSS (Dart Sass, CSS custom properties)      |
| Tests          | Vitest + React Testing Library (jsdom)       |

## Structure

```text
src/
├── App.tsx              # Routes + guards (ProtectedRoute / GuestRoute)
├── main.tsx             # Bootstrap: BrowserRouter + AuthProvider
├── auth/                # AuthContext, context/hook, session storage
├── api/                 # axios client + auth/tasks endpoints
├── components/          # TaskCard, TaskFilters, StatusBadge, Toasts, Layout
├── mqtt/useNotifications.ts  # subscribe to notifications/{userId}
├── pages/               # Login, Register, Tasks, TaskForm (new/edit), TaskDetail
├── styles/main.scss     # design system (light/dark)
└── test/setup.ts        # jest-dom + cleanup
```

## Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Dev server (proxy `/api` → 3000, `/mqtt` → 8083) |
| `npm run build`       | `tsc -b` + `vite build`            |
| `npm run lint`        | oxlint                             |
| `npm test`            | Vitest (jsdom, RTL)                |
| `npm run test:coverage` | Vitest + v8 coverage (threshold ≥ 70%) |

## Environment

Copy `.env.example` to `.env` if you need to change defaults:

```bash
VITE_API_URL=/api          # relative works in dev (proxy) and prod (nginx)
VITE_MQTT_URL=             # empty -> ws(s)://<host>/mqtt; local dev: ws://localhost:8083
```

## Docker

The `Dockerfile` builds the app with Node 24 and serves it with **nginx**, which:

- serves the SPA (history fallback to `index.html`);
- proxies `/api/*` to `backend:3000/api/*`;
- proxies `/mqtt` (WebSocket) to `mosquitto:8083`.

```bash
docker compose -f ../docker-compose.yml up --build frontend
# http://localhost:5173
```