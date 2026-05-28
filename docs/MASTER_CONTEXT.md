# CollabCPP — MASTER CONTEXT (AI Recovery File)

> **Purpose:** Internal context preservation for LLM-assisted development.  
> **NOT** end-user documentation. Read this file at the start of any new chat session before implementing features.  
> **Last updated:** Phases 1–5 complete. Phase 6 not started.  
> **Repo root:** `CollabCPP/` with `client/` (React) and `server/` (Express).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Implemented Phases (1–5)](#3-implemented-phases-15)
4. [Complete Folder Structure](#4-complete-folder-structure)
5. [Authentication Architecture](#5-authentication-architecture)
6. [Room System Architecture](#6-room-system-architecture)
7. [Socket.IO Architecture](#7-socketio-architecture)
8. [Monaco Collaboration Architecture](#8-monaco-collaboration-architecture)
9. [Frontend State Management](#9-frontend-state-management)
10. [Important Reusable Components](#10-important-reusable-components)
11. [API Structure](#11-api-structure)
12. [Socket Events (Complete Reference)](#12-socket-events-complete-reference)
13. [UI/UX Design System](#13-uiux-design-system)
14. [Engineering Conventions](#14-engineering-conventions)
15. [Known Limitations / TODOs](#15-known-limitations--todos)
16. [Next Phase Preparation](#16-next-phase-preparation)

---

## 1. Project Overview

### What CollabCPP Is

**CollabCPP** is a realtime collaborative **C++ technical interview platform** built strictly on the **MERN stack**. Multiple authenticated users join **interview rooms**, write C++ code together in a shared **Monaco Editor**, see each other's presence, cursors, and typing state — with architecture prepared for chat, whiteboard, and code execution in later phases.

### Primary Goals

- Provide a **focused developer tool** for technical interviews (not a generic IDE, not a toy app).
- **Realtime collaboration** with low perceived latency for code and presence.
- **Production-style architecture**: modular backend, reusable frontend, clear separation of concerns.
- **Phased delivery**: foundation → auth → rooms → sockets → collaborative editor → (future) chat, execution, whiteboard.

### Realtime Collaboration Purpose

- **Room** = isolated collaboration session keyed by human-readable ID (`cpp-7F3K2A`).
- **Socket.IO** = transport for presence, editor sync, cursors, typing (room-scoped, never global broadcast).
- **REST API** = durable membership (MongoDB), auth, room metadata.
- **In-memory server state** = live code, cursors, typers, socket presence (Redis-ready later).

### Product Philosophy

- **Dark mode only** — inspired by Linear, Vercel, Raycast.
- **Minimal, premium, developer-centric** UI.
- **No feature bloat per phase** — placeholders exist for future modules (chat, whiteboard, output).
- **Shareable room links** — guests must be **logged in**; opening `/room/:roomId` auto-joins membership when allowed.
- **Do not rewrite** working auth/socket/editor architecture unless fixing a clear bug.

### Strict Stack Constraints (DO NOT USE)

| Forbidden | Use Instead |
|-----------|-------------|
| Next.js, TypeScript | React (JS) + Vite |
| Redux | Zustand (+ optional Context) |
| PostgreSQL, Prisma | MongoDB + Mongoose |
| Firebase, GraphQL | Express REST + Socket.IO |
| Docker/K8s/microservices | Monolithic MERN app |

---

## 2. Tech Stack

### Frontend

| Technology | Version (approx) | Role |
|------------|------------------|------|
| React | 18.3 | UI |
| Vite | 6.x | Build/dev server |
| React Router | 6.28 | Routing |
| TailwindCSS | 3.4 | Styling (dark only) |
| Axios | 1.7 | HTTP client |
| Zustand | 5.x | Auth, socket, app UI state |
| Socket.IO Client | 4.8 | Realtime |
| @monaco-editor/react | 4.6 | Editor wrapper |
| monaco-editor | 0.52 | Editor core |

**Fonts (Google):** Inter (UI), JetBrains Mono (code).

### Backend

| Technology | Version (approx) | Role |
|------------|------------------|------|
| Node.js | 18+ | Runtime |
| Express | 4.21 | HTTP API |
| MongoDB + Mongoose | 8.9 | Persistence |
| Socket.IO | 4.8 | WebSockets (same HTTP server) |
| jsonwebtoken | 9.x | JWT |
| bcryptjs | 2.4 | Password hashing |
| helmet, cors, compression, morgan, dotenv | — | Middleware / config |

### Dev URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API base | http://localhost:5000/api |
| Socket.IO | http://localhost:5000 (or `VITE_SOCKET_URL`) |
| Health | http://localhost:5000/api/health |

### Environment Variables

**server/.env**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/collabcpp
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
```

**client/.env**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Vite proxy** (`client/vite.config.js`): `/api` and `/socket.io` → `localhost:5000`.

---

## 3. Implemented Phases (1–5)

### Phase 1 — Project Setup & Architecture ✅

**Implemented:**

- Vite + React client, Express server, MongoDB connection.
- Tailwind dark theme, folder structure, layouts (Root, App, Auth).
- Landing page, basic dashboard shell, Axios service, health API.
- Centralized error handling, JSON logger, middleware pipeline.
- Socket folder **stub** only (placeholder).

**Key files:** `server/app.js`, `server/server.js`, `server/config/`, `client/src/App.jsx`, `client/src/styles/index.css`.

**Architectural decisions:**

- Single HTTP server; Socket.IO attached later to same `http.Server`.
- ES modules (`"type": "module"`) on both sides.
- API mounted at `/api`.

---

### Phase 2 — Authentication System ✅

**Implemented:**

- User model: `username`, `email`, `password` (hashed), timestamps.
- Routes: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`.
- JWT in `Authorization: Bearer <token>`.
- `protect` middleware on protected REST routes.
- Frontend: Login/Signup pages, `useAuthStore` (Zustand + persist), `ProtectedRoute`, `GuestRoute`, `AuthInitializer`.
- Token in `localStorage` key `collabcpp_token`.

**Key files:**

- `server/models/User.js`
- `server/controllers/authController.js`
- `server/middleware/authMiddleware.js`
- `client/src/store/useAuthStore.js`
- `client/src/utils/token.js`
- `client/src/services/api.js` (interceptors)

**Flow:**

1. Signup/login → API returns `{ user, token }`.
2. Store token → subsequent Axios requests attach header.
3. App load → `initializeAuth()` calls `/auth/me` to restore session.
4. Logout → clear token, disconnect socket.

---

### Phase 3 — Dashboard & Room System ✅

**Implemented:**

- Room MongoDB schema: `roomId`, `title`, `owner`, `participants[]`, timestamps.
- Human-readable IDs: `cpp-XXXXXX` (not ObjectId) via `server/utils/generateRoomId.js`.
- APIs: create, join, recent, get by id.
- Dashboard: create modal, join form, recent sessions list.
- Room page **layout skeleton** (participants, editor placeholder, chat, whiteboard, output).
- Protected routes for `/dashboard` and `/room/:roomId`.

**Key files:**

- `server/models/Room.js`
- `server/services/roomService.js`
- `server/controllers/roomController.js`
- `server/routes/roomRoutes.js`
- `client/src/pages/DashboardPage.jsx`
- `client/src/pages/RoomPage.jsx`

**Critical fix (membership):**

- User opening `/room/cpp-XXX` via link without prior join used to get **403 / no access**.
- **Fix:** `GET /api/rooms/:roomId` auto-calls `ensureRoomMembership` on 403; client `useRoom` also retries join.
- Socket join waits for `accessReady` from REST before `join_room`.

---

### Phase 4 — Socket.IO Foundation ✅

**Implemented:**

- Socket.IO on HTTP server with CORS + JWT handshake (`auth.token`).
- Modular handlers: `connectionHandler`, `roomSocket`, `editorSocket` (editor added in P5).
- Events: `join_room`, `leave_room`, presence sync/join/left.
- In-memory `participantStore` (socketId, userId, username, roomId).
- Room channels via `socket.join(roomId)` — broadcasts use `socket.to(roomId)` or `io.to(roomId)`, **never** `io.emit` globally.
- Disconnect cleanup removes participant and notifies room.
- Frontend: `socketClient.js` singleton, `useSocketStore`, `useRoomSocket`, merged presence UI.

**Key files:**

- `server/sockets/index.js`
- `server/sockets/handlers/connectionHandler.js`
- `server/sockets/roomSocket.js`
- `server/sockets/utils/participantStore.js`
- `server/sockets/utils/socketAuth.js`
- `server/sockets/utils/roomAccess.js`
- `client/src/sockets/socketClient.js`
- `client/src/hooks/useRoomSocket.js`

---

### Phase 5 — Collaborative Monaco Editor ✅

**Implemented:**

- Monaco Editor (`vs-dark`, language `cpp`) as primary room focus.
- Full-document sync with **120ms debounce** on `code_change`.
- **Loop prevention** via `isApplyingRemoteRef` + ignore own `origin.userId`.
- Cursor sync **throttled 80ms**; decorations for remote cursors.
- Typing indicators (`typing_start` / `typing_stop`, 2s client idle).
- Server `editorStateStore` (in-memory code, version, cursors, typers).

**Key files:**

- `server/sockets/handlers/editorSocket.js`
- `server/sockets/utils/editorStateStore.js`
- `client/src/hooks/useCollaborativeEditor.js`
- `client/src/components/editor/CollaborativeEditor.jsx`
- `client/src/components/editor/RemoteCursorDecorations.jsx`
- `client/src/components/editor/EditorTypingIndicator.jsx`

**NOT implemented in P5:** OT/CRDT, per-keystroke ops, chat, whiteboard, execution.

---

## 4. Complete Folder Structure

```
CollabCPP/
├── README.md                 # User-facing setup (shorter than this file)
├── docs/
│   └── MASTER_CONTEXT.md     # THIS FILE
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── jsconfig.json         # @/* → src/*
│   ├── .env / .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── auth/           # Input, AuthCard, Spinner
│       │   ├── editor/         # CollaborativeEditor, cursors, typing
│       │   ├── room/           # Room panels, header, participants
│       │   ├── rooms/          # Create/join modals, recent list
│       │   ├── ui/             # Button, Card, Badge, Modal
│       │   ├── AuthInitializer.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── GuestRoute.jsx
│       │   ├── Navbar.jsx, Footer.jsx, Logo.jsx, Sidebar.jsx, ...
│       ├── context/
│       │   └── AppContext.jsx  # Foundation only (optional)
│       ├── hooks/
│       │   ├── useHealth.js
│       │   ├── useRooms.js
│       │   ├── useRoomSocket.js
│       │   └── useCollaborativeEditor.js
│       ├── layouts/
│       │   ├── RootLayout.jsx
│       │   ├── AppLayout.jsx
│       │   └── AuthLayout.jsx
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── SignupPage.jsx
│       │   ├── DashboardPage.jsx
│       │   └── RoomPage.jsx
│       ├── services/
│       │   └── api.js
│       ├── sockets/
│       │   ├── socketClient.js
│       │   ├── socketEvents.js
│       │   └── index.js
│       ├── store/
│       │   ├── useAuthStore.js
│       │   ├── useSocketStore.js
│       │   └── useAppStore.js
│       ├── styles/
│       │   ├── index.css       # Tailwind layers
│       │   └── editor.css      # Monaco overrides
│       └── utils/
│           ├── cn.js, token.js, throttle.js, userColor.js, defaultCode.js
│
└── server/
    ├── server.js               # Entry: HTTP + Socket.IO + DB
    ├── app.js                  # Express app
    ├── package.json
    ├── .env / .env.example
    ├── config/
    │   ├── env.js
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── healthController.js
    │   └── roomController.js
    ├── middleware/
    │   ├── authMiddleware.js   # protect
    │   ├── asyncHandler.js
    │   ├── errorHandler.js
    │   ├── notFound.js
    │   └── requestLogger.js
    ├── models/
    │   ├── User.js
    │   └── Room.js
    ├── routes/
    │   ├── index.js
    │   ├── authRoutes.js
    │   ├── healthRoutes.js
    │   └── roomRoutes.js
    ├── services/
    │   └── roomService.js
    ├── sockets/
    │   ├── index.js            # initSocketIO, getIO
    │   ├── roomSocket.js
    │   ├── handlers/
    │   │   ├── connectionHandler.js
    │   │   └── editorSocket.js
    │   └── utils/
    │       ├── socketEvents.js
    │       ├── participantStore.js
    │       ├── editorStateStore.js
    │       ├── socketAuth.js
    │       ├── roomAccess.js
    │       └── defaultCode.js
    └── utils/
        ├── AppError.js
        ├── logger.js
        ├── generateToken.js
        ├── generateRoomId.js
        └── validateAuth.js, validateRoom.js
```

---

## 5. Authentication Architecture

### JWT Flow

1. **Signup/Login** → server validates credentials → `generateToken(user._id)` → JWT signed with `JWT_SECRET`, expires `JWT_EXPIRES_IN` (default `7d`).
2. Client stores token in **localStorage** (`collabcpp_token`) and Zustand persist (`collabcpp-auth`).
3. **REST:** Axios interceptor adds `Authorization: Bearer <token>`.
4. **Socket:** `connectSocket(token)` passes `auth: { token }` in handshake.
5. **Socket auth middleware** (`socketAuth.js`) verifies JWT, loads User, sets `socket.user = { id, username, email }`.

### Auth Middleware (REST)

```javascript
// server/middleware/authMiddleware.js — export protect
// Reads Bearer token, jwt.verify, User.findById, req.user = user document
```

All `/api/rooms/*` routes use `router.use(protect)`.

### Auth Persistence (Client)

- `useAuthStore` + `persist` middleware stores `user`, `token`, `isAuthenticated`.
- `onRehydrateStorage` syncs token back to `localStorage`.
- `AuthInitializer` blocks app until `initializeAuth()` completes (`isInitialized`).

### Protected Routes

| Component | Behavior |
|-----------|----------|
| `ProtectedRoute` | No auth → redirect `/login` with `state.from` |
| `GuestRoute` | Authenticated → redirect `/dashboard` |
| `AppLayout` routes | Wrapped in ProtectedRoute |
| `RoomPage` | ProtectedRoute but **no** AppLayout sidebar (fullscreen room) |

### Token Handling

```javascript
// client/src/utils/token.js
getStoredToken() / setStoredToken() / clearStoredToken()

// api.js interceptor: attach token; on 401 (except login) clearStoredToken()
// logout: useSocketStore.disconnect() + clearAuth()
```

### User Public Shape

```javascript
// User.toPublicJSON()
{ id, username, email, createdAt, updatedAt }
// password never returned (select: false on schema)
```

---

## 6. Room System Architecture

### Room MongoDB Schema

```javascript
{
  roomId: String,      // unique, e.g. "cpp-7F3K2A"
  title: String,       // max 80 chars
  owner: ObjectId,     // ref User
  participants: [{
    user: ObjectId,
    joinedAt: Date
  }],
  createdAt, updatedAt  // timestamps
}
```

**Methods:**

- `hasParticipant(userId)` — owner OR in participants (uses `toIdString` for populated refs).
- `toPublicJSON()` — basic room fields.

### Room ID Generation

- Format: `cpp-` + 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Regex: `/^cpp-[A-HJ-NP-Z2-9]{6}$/i`
- `normalizeRoomId()` → uppercase suffix, lowercase `cpp-` prefix.

### Room Creation Flow

1. User POST `/api/rooms/create` with `{ title }`.
2. `createRoomForUser` → generate unique `roomId` → create doc with owner + owner in `participants`.
3. Client navigates to `/room/${room.roomId}`.

### Room Joining Flow

**Explicit join:** Dashboard `JoinRoomForm` → POST `/api/rooms/join` → navigate to room.

**Implicit join (link):**

1. GET `/api/rooms/:roomId` → if 403, `ensureRoomMembership` adds user to participants → returns room.
2. Client `useRoom` on 403 also calls `roomsApi.join` then refetch.

**Socket join (after REST ready):**

1. `useRoomSocket(roomId, accessReady)` only runs when `accessReady === true`.
2. Emits `join_room` with normalized roomId.
3. Server `assertRoomAccess` (Mongo query on owner/participants).
4. `socket.join(roomId)`, `addParticipant`, broadcasts.

### Room Ownership

- `owner` field set at creation; `isOwner` computed in API responses.
- Owner is always a participant; does not confer extra socket permissions yet.

### Room APIs Summary

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/rooms/create` | Yes | Body: `{ title }` |
| POST | `/api/rooms/join` | Yes | Body: `{ roomId }` |
| GET | `/api/rooms/recent` | Yes | User's rooms by `updatedAt` |
| GET | `/api/rooms/:roomId` | Yes | Auto-join on 403 |

### Access Control

```javascript
// server/sockets/utils/roomAccess.js — assertRoomAccess
Room.findOne({ roomId, $or: [{ owner: uid }, { 'participants.user': uid }] })
```

Socket and REST both enforce membership before room actions.

---

## 7. Socket.IO Architecture

### Server Initialization

```javascript
// server/server.js
const server = http.createServer(app);
initSocketIO(server);

// server/sockets/index.js
io = new Server(httpServer, { cors: { origin: env.clientUrl, credentials: true } });
io.use(authenticateSocket);
io.on('connection', (socket) => registerConnectionHandlers(io, socket));
```

### Server Socket Structure

```
connection
  └── registerConnectionHandlers(io, socket)
        ├── emit connection_ack
        ├── registerRoomSocketHandlers(io, socket)
        ├── registerEditorSocketHandlers(io, socket)
        └── on disconnect → removeParticipant, PARTICIPANT_LEFT, handleEditorDisconnect
```

### Room-Based Communication

- **Channel name** = `roomId` string (e.g. `cpp-ABC123`).
- Join: `socket.join(roomId)`.
- Broadcast to others: `socket.to(roomId).emit(...)`.
- Broadcast to entire room including self: `io.to(roomId).emit(...)` (used for `PARTICIPANTS_SYNC` after join).

**Never** use `io.emit()` for room data.

### Participant Tracking (In-Memory)

**File:** `server/sockets/utils/participantStore.js`

```javascript
// rooms: Map<roomId, Map<socketId, Participant>>
// socketIndex: Map<socketId, { roomId, userId, username }>

Participant = { socketId, userId, username, roomId, joinedAt }
```

- One user may have multiple sockets (tabs) → multiple entries until deduped in UI by `userId`.
- On disconnect: `removeParticipant(socketId)` → emit `PARTICIPANT_LEFT` + editor cleanup.

### Connection Lifecycle

```
Client connect (JWT) → connection_ack
Client join_room → assertRoomAccess → socket.join
  → PARTICIPANT_JOINED (to others)
  → PARTICIPANTS_SYNC (io.to room — all)
  → EDITOR_CODE_SYNC (to joiner)
Client leave_room / unmount → leave socket room, remove from store
Client disconnect → same cleanup + EDITOR_CURSOR_REMOVE, EDITOR_TYPING_UPDATE
```

### Disconnect Cleanup

- `connectionHandler` → `removeParticipant` → `PARTICIPANT_LEFT` to room.
- `handleEditorDisconnect` → `clearEditorPresence`, `EDITOR_CURSOR_REMOVE`, `EDITOR_TYPING_UPDATE`.

### Event Naming Conventions

| Pattern | Example | Direction |
|---------|---------|-----------|
| snake_case | `join_room` | Client → Server |
| room:prefix | `room:participants_sync` | Server → Client (presence) |
| editor:prefix | `editor:code_change` | Server → Client (editor) |

**Source of truth:** `server/sockets/utils/socketEvents.js` — client mirrors in `client/src/sockets/socketEvents.js`.

### Client Socket Architecture

**Singleton** (`socketClient.js`):

- One Socket.IO connection per session.
- `connectSocket(token)` / `disconnectSocket()`.
- `emitJoinRoom` / `emitLeaveRoom` with ack callbacks.
- `onSocketEvent` returns unsubscribe function.

**Hooks:**

- `useSocketStore` — connection status, connect/disconnect, subscribe helper.
- `useRoomSocket` — presence only; enabled when `accessReady`.
- `useCollaborativeEditor` — editor events; enabled when `isJoined && accessReady`.

---

## 8. Monaco Collaboration Architecture

### High-Level Sync Flow

```
┌─────────────┐     code_change (debounced)      ┌─────────────┐
│  Client A   │ ───────────────────────────────► │   Server    │
│  Monaco     │                                  │ editorState │
└─────────────┘                                  └──────┬──────┘
       ▲                                                │
       │         editor:code_change (excludes sender)    │
       └────────────────────────────────────────────────┘
                          Client B applies with guard
```

### Code Update Flow (Local → Remote)

1. User types in Monaco → `onChange` → `handleEditorChange`.
2. If `isApplyingRemoteRef.current` → **return** (no emit).
3. `setCode(local)` + `emitCodeChangeRef` debounced **120ms**.
4. Server `CODE_CHANGE` → `updateRoomCode` → `version++`.
5. Server `socket.to(roomId).emit(EDITOR_CODE_CHANGE, { code, version, origin })`.
6. Remote clients: `applyRemoteCode` if `origin.userId !== self` and `version >= local`.

### Infinite Loop Prevention

**Problem:** Remote `setValue` / `onChange` re-triggers `code_change` → echo storm.

**Solution (multi-layer):**

1. **`isApplyingRemoteRef`** — set `true` before applying remote code; `onChange` checks and skips emit.
2. **Ignore own origin** — `if (originUserId === currentUser?.id) return`.
3. **Version guard** — ignore stale `editor:code_change` with `newVersion < versionRef.current`.
4. **Server excludes sender** — `socket.to(roomId)` not `socket.emit` for code changes.

```javascript
// client/src/hooks/useCollaborativeEditor.js
const isApplyingRemoteRef = useRef(false);

handleEditorChange(value) {
  if (isApplyingRemoteRef.current) return;
  setCode(value);
  emitCodeChangeRef.current(roomId, value);
  emitTypingStart();
}
```

### Initial Sync on Join

After `join_room`, server sends to joining socket:

```javascript
socket.emit(EDITOR_CODE_SYNC, {
  roomId,
  code,      // full document
  version,
  cursors,   // array
  typers,    // array
});
```

Client sets code with `isApplyingRemoteRef` guard and populates `remoteCursors` / `typers`.

### Cursor Synchronization

- Local: `editor.onDidChangeCursorPosition` → throttled **80ms** → `cursor_move`.
- Server: updates `editorStateStore.cursors`, broadcasts `editor:cursor_move` to room (excludes sender via `socket.to`).
- Remote: `RemoteCursorDecorations` uses `editor.deltaDecorations` + username label.
- Disconnect: `editor:cursor_remove` with `userId`.

### Typing Indicators

- On local edit: `typing_start` (once until stop), reset **2s** idle timer → `typing_stop`.
- Server maintains `typers` Map, prunes stale after **4s** (`TYPING_TTL_MS`).
- Broadcast `editor:typing_update` with `{ typers: [{ userId, username }] }`.
- UI: `EditorTypingIndicator` in editor toolbar.

### Throttling / Debouncing Constants

| Constant | Value | Location |
|----------|-------|----------|
| `CODE_DEBOUNCE_MS` | 120 | `useCollaborativeEditor.js` |
| `CURSOR_THROTTLE_MS` | 80 | `useCollaborativeEditor.js` |
| `TYPING_STOP_MS` | 2000 | client idle |
| `TYPING_TTL_MS` | 4000 | server prune |

### Room Code State (Server, In-Memory)

**File:** `server/sockets/utils/editorStateStore.js`

```javascript
roomStates: Map<roomId, {
  code: string,           // default DEFAULT_CPP_CODE
  version: number,        // increments each code_change
  cursors: Map<userId, cursorState>,
  typers: Map<userId, typerState>,
}>
```

**Not persisted to MongoDB** — server restart loses live buffer (rooms in DB unaffected).

### Monaco UI Configuration

- Theme: `vs-dark`
- Language: `cpp`
- Options: no minimap, word wrap, JetBrains Mono, `automaticLayout: true`
- Wrapper: `client/src/components/editor/CollaborativeEditor.jsx`

### Room Page Orchestration

```javascript
// RoomPage.jsx load order:
useRoom(roomId)           → REST membership, room metadata, accessReady
useRoomSocket(id, accessReady)     → presence socket
useCollaborativeEditor(id, isJoined && accessReady, user)  → editor socket
```

**Critical:** Socket editor must NOT start before REST `accessReady` or join_room fails with "no access".

---

## 9. Frontend State Management

### Zustand Stores

| Store | File | Responsibility |
|-------|------|----------------|
| `useAuthStore` | `store/useAuthStore.js` | user, token, login/signup/logout, `initializeAuth`, persist |
| `useSocketStore` | `store/useSocketStore.js` | status: disconnected/connecting/connected/error, connect, disconnect, subscribe |
| `useAppStore` | `store/useAppStore.js` | sidebar open/close, API health (dashboard legacy) |

### Auth State

- Persisted: `user`, `token`, `isAuthenticated`.
- `isInitialized` gates app render in `AuthInitializer`.

### Socket State

- **Connection-level** in `useSocketStore` (not per-room).
- **Room presence** in `useRoomSocket` local state: `liveParticipants`, `roomSocketStatus`, `roomError`.
- **Editor** in `useCollaborativeEditor` local state: `code`, `version`, `remoteCursors`, `typers`.

### Room State

- **REST room object** from `useRoom`: title, owner, participants, roomId, isOwner.
- **Not** in global store — hook-local to `RoomPage` / `DashboardPage`.

### Editor State

- Controlled `code` string drives Monaco `value` prop.
- Refs: `editorRef`, `monacoRef`, `isApplyingRemoteRef`.
- No Redux; no separate editor Zustand store (by design — colocated in hook).

### Context API

- `AppContext.jsx` exists as **foundation only** (minimal `ready` flag). Primary state is Zustand.

---

## 10. Important Reusable Components

### Layouts

| Component | Purpose |
|-----------|---------|
| `RootLayout` | Marketing shell: Navbar + Footer |
| `AppLayout` | Dashboard shell: Sidebar + header |
| `AuthLayout` | Login/signup minimal header |

### Auth

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Auth gate |
| `GuestRoute` | Redirect authed users away from login |
| `AuthInitializer` | Session restore loader |
| `AuthCard`, `Input`, `Spinner` | Auth form UI |

### Room Workspace

| Component | Purpose |
|-----------|---------|
| `RoomPage` | Orchestrates hooks + layout |
| `RoomHeader` | Title, room ID copy, connection status |
| `ParticipantsPanel` | Merged DB + live presence |
| `EditorPanel` | Toolbar + CollaborativeEditor |
| `ChatPanel`, `WhiteboardPanel`, `OutputPanel` | **Placeholders** (Phase 6+) |
| `ConnectionStatus` | Live/connecting/error dot |

### Editor

| Component | Purpose |
|-----------|---------|
| `CollaborativeEditor` | Monaco wrapper |
| `RemoteCursorDecorations` | deltaDecorations for remote cursors |
| `EditorTypingIndicator` | "X is typing..." |

### Dashboard / Rooms

| Component | Purpose |
|-----------|---------|
| `CreateRoomModal` | Title → create API → navigate |
| `JoinRoomForm` | roomId → join API → navigate |
| `RecentRoomsList` | Recent sessions links |

### UI Primitives

| Component | Purpose |
|-----------|---------|
| `Button` | variants: primary, secondary, ghost, outline |
| `Card` | bordered panels |
| `Badge` | status chips |
| `Modal` | overlay dialogs |
| `Logo`, `Navbar`, `Sidebar`, `StatCard` | chrome |

---

## 11. API Structure

### Base

- Prefix: `/api`
- JSON body/response
- Success shape: `{ success: true, data: { ... } }`
- Error shape: `{ success: false, message, errors? }`

### Auth Routes (`/api/auth`)

**POST /signup**

```json
// Request
{ "username": "dev1", "email": "a@b.com", "password": "password123" }

// Response 201
{ "success": true, "data": { "user": { "id", "username", "email", ... }, "token": "jwt..." } }
```

**POST /login**

```json
// Request
{ "email": "a@b.com", "password": "password123" }

// Response 200 — same shape as signup
```

**GET /me** — Header: `Authorization: Bearer <token>`

```json
{ "success": true, "data": { "user": { ... } } }
```

### Room Routes (`/api/rooms`) — all protected

**POST /create**

```json
// Request
{ "title": "Senior C++ Interview" }

// Response 201
{ "success": true, "data": { "room": { "roomId", "title", "owner", "participants", "isOwner", ... } } }
```

**POST /join**

```json
// Request
{ "roomId": "cpp-7F3K2A" }

// Response 200
{ "success": true, "data": { "room": { ... } } }
```

**GET /recent**

```json
{ "success": true, "data": { "rooms": [ ... ], "count": 3 } }
```

**GET /:roomId**

```json
{ "success": true, "data": { "room": { ... }, "joined": true } }  // joined only when auto-joined
```

### Health

- `GET /api/health` — uptime, DB status, phase number
- `GET /api` — API info

---

## 12. Socket Events (Complete Reference)

> **Sync rule:** `server/sockets/utils/socketEvents.js` === `client/src/sockets/socketEvents.js`

### Client → Server

#### `join_room`

```json
// Emit
{ "roomId": "cpp-7F3K2A" }

// Ack callback
{ "success": true, "roomId": "cpp-7F3K2A", "participant": { "socketId", "userId", "username", "roomId", "joinedAt" } }
// or { "success": false, "message": "..." }
```

#### `leave_room`

```json
// Emit
{ "roomId": "cpp-7F3K2A" }  // optional; defaults to current room

// Ack
{ "success": true, "roomId": "cpp-7F3K2A" }
```

#### `code_change`

```json
{ "roomId": "cpp-7F3K2A", "code": "#include <iostream>\n..." }
```

No ack. Server broadcasts `editor:code_change` to others.

#### `cursor_move`

```json
{
  "roomId": "cpp-7F3K2A",
  "position": { "lineNumber": 12, "column": 4 },
  "selection": {
    "startLineNumber": 12, "startColumn": 4,
    "endLineNumber": 12, "endColumn": 10
  }
}
```

#### `typing_start`

```json
{ "roomId": "cpp-7F3K2A" }
```

#### `typing_stop`

```json
{ "roomId": "cpp-7F3K2A" }
```

---

### Server → Client

#### `connection_ack` (to connecting socket only)

```json
{
  "socketId": "abc123",
  "user": { "id": "userId", "username": "dev1" }
}
```

#### `room:participants_sync` (to room `io.to(roomId)`)

```json
{
  "roomId": "cpp-7F3K2A",
  "participants": [
    { "socketId", "userId", "username", "roomId", "joinedAt" }
  ],
  "count": 2
}
```

#### `room:participant_joined` (to others in room)

```json
{
  "roomId": "cpp-7F3K2A",
  "participant": { "socketId", "userId", "username", "roomId", "joinedAt" }
}
```

#### `room:participant_left`

```json
{
  "roomId": "cpp-7F3K2A",
  "participant": { "socketId", "userId", "username" }
}
```

#### `room:error` (to offending socket)

```json
{ "message": "You do not have access to this room" }
```

#### `editor:code_sync` (to joiner on join_room)

```json
{
  "roomId": "cpp-7F3K2A",
  "code": "...",
  "version": 42,
  "cursors": [ { "userId", "socketId", "username", "position", "selection" } ],
  "typers": [ { "userId", "username" } ]
}
```

#### `editor:code_change` (to others in room)

```json
{
  "roomId": "cpp-7F3K2A",
  "code": "...",
  "version": 43,
  "origin": { "userId", "socketId", "username" }
}
```

#### `editor:cursor_move`

```json
{
  "roomId": "cpp-7F3K2A",
  "cursor": {
    "userId", "socketId", "username",
    "position": { "lineNumber", "column" },
    "selection": null | { ... }
  }
}
```

#### `editor:cursor_remove`

```json
{ "roomId": "cpp-7F3K2A", "userId": "..." }
```

#### `editor:typing_update`

```json
{
  "roomId": "cpp-7F3K2A",
  "typers": [ { "userId", "username" } ]
}
```

---

## 13. UI/UX Design System

### Dark Mode Philosophy

- **Only dark mode** — `html class="dark"`, no toggle.
- Background: `#0a0a0b` (`surface`).
- Raised panels: `#111113` (`surface-raised`).
- No bright gradients or childish colors.

### Color Tokens (Tailwind)

```javascript
surface: { DEFAULT, raised, overlay, border, muted }
accent: { DEFAULT, muted, dim }
brand: { DEFAULT, highlight }
```

### Typography

- UI: Inter
- Code: JetBrains Mono (editor + room IDs)

### Component Aesthetic

- Subtle borders (`border-surface-border`)
- Shadows: `shadow-soft`, `shadow-card`, `shadow-elevated`
- Rounded corners (`rounded-lg`, `rounded-xl`)
- Transitions `duration-200` on hovers
- Badges for status (success, warning, error)

### Spacing Philosophy

- Room layout: `p-2` gap grid, sidebar `w-64`, editor flex-1 dominant.
- Auth cards: centered, max-w-md.
- Dashboard: max-w-3xl centered content.

### Interaction Philosophy

- Loading spinners for async (auth, room load, socket joining).
- Online = emerald dot; offline = muted dot.
- Connection header: Live / Connecting / Error.
- Minimal animation (`animate-fade-in`, `animate-slide-up`) — no noisy motion.

### Room Layout (Current)

```
┌──────────────┬──────────────────────────────┐
│ Participants │  Editor (Monaco — primary)   │
│ Chat (stub)  │                              │
│ Whiteboard   ├──────────────────────────────┤
│ (stub)       │  Output (stub)               │
└──────────────┴──────────────────────────────┘
```

---

## 14. Engineering Conventions

### Naming

| Area | Convention |
|------|------------|
| React components | PascalCase files `.jsx` |
| Hooks | `use` prefix camelCase |
| Socket events | snake_case C→S, `room:` / `editor:` S→C |
| Room IDs | `cpp-XXXXXX` uppercase suffix |
| API routes | kebab-less REST segments |

### Folder Placement

- **New socket handler domain** → `server/sockets/handlers/<name>Socket.js`, register in `connectionHandler.js`.
- **New socket event** → add to `socketEvents.js` both sides.
- **New REST resource** → `controllers/`, `routes/`, optional `services/`.
- **Room UI panel** → `client/src/components/room/`.
- **Editor feature** → `client/src/components/editor/` + `hooks/useCollaborativeEditor.js` or sibling hook.

### Socket Organization Philosophy

- One file per domain: `roomSocket.js`, `editorSocket.js`.
- Shared stores in `sockets/utils/`.
- No monolithic 500-line `index.js` handler block.
- Always validate `getParticipantRoom(socket.id)` before processing room events.

### Reusable Hook Philosophy

- Colocate subscription + cleanup in `useEffect` return.
- Return unsubscribe from `useSocketStore.subscribe`.
- Pass `enabled` flags to defer socket work until prerequisites (auth, REST access).
- Use refs for guards (`isApplyingRemoteRef`, `joinedRef`) not state when avoiding re-renders.

### Cleanup Patterns

```javascript
// Socket hook cleanup template:
return () => {
  unsubscribers.forEach(fn => fn());
  emitLeaveRoom(roomId);
  clearTimers();
};
```

- `disconnectSocket` on logout removes all listeners.
- Monaco decorations cleaned in `RemoteCursorDecorations` effect return.

### Error Handling

- **REST:** `AppError` + `errorHandler` middleware; Mongoose errors mapped.
- **Client:** Axios normalizes to `{ message, status, data }`.
- **Socket:** `room:error` event + join ack failure messages.

### Do NOT

- Rewrite auth or socket architecture without cause.
- Use TypeScript or Next.js.
- Global `io.emit` for room events.
- Start `join_room` before REST membership ready.
- Emit code changes while `isApplyingRemoteRef` is true.

---

## 15. Known Limitations / TODOs

### Not Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Code execution | ❌ | Output panel is placeholder |
| Realtime chat | ❌ | Chat panel UI only |
| Whiteboard sync | ❌ | Whiteboard panel UI only |
| OT/CRDT editor | ❌ | Full-document sync only |
| Editor persistence to MongoDB | ❌ | In-memory `editorStateStore` only |
| Redis adapter for Socket.IO | ❌ | Single server assumed |
| Horizontal scaling | ❌ | In-memory state |
| Room passwords / private links | ❌ | Any authed user with ID can join |
| Role-based permissions (interviewer/candidate) | ❌ | Only `isOwner` flag |
| Session recording / playback | ❌ | — |
| Production deployment config | ❌ | No Docker/K8s by design |
| Email verification / OAuth | ❌ | Local auth only |
| Rate limiting | ❌ | — |
| Automated tests | ❌ | — |

### Known Behavioral Quirks

- **Full buffer sync** may lag on very large files (acceptable for interviews).
- **Multiple tabs** = multiple socket connections = duplicate presence until deduped by userId in UI.
- **Server restart** clears live code buffer; MongoDB room membership persists.
- Remote cursor decorations are **labels**, not full Monaco remote caret widgets.
- `useAppStore` health check on dashboard was de-emphasized in Phase 3+ UI.

### Persistence Gaps

| Data | Stored |
|------|--------|
| Users | MongoDB ✅ |
| Room metadata + participants | MongoDB ✅ |
| Live code, cursors, typers | Memory only ⚠️ |
| Socket presence | Memory only ⚠️ |

---

## 16. Next Phase Preparation

### Recommended Phase 6 Focus: **Realtime Chat**

**Why chat before execution:** Chat is socket-only + UI in existing `ChatPanel`; no sandbox infrastructure. Builds on same room channel patterns as editor.

**Suggested implementation:**

1. **Server**
   - `chatStateStore` or extend room state with message buffer (cap length).
   - Events: `chat_message` (C→S), `chat:message` (S→C room), `chat:history_sync` on join.
   - Validate room membership like editor handlers.
   - Optional: persist messages to MongoDB `Message` schema for history.

2. **Client**
   - `useRoomChat(roomId, enabled)` hook.
   - Replace `ChatPanel` placeholder with message list + input.
   - Auto-scroll, username + timestamp, dark minimal bubbles.
   - Do not break `useCollaborativeEditor` listeners (separate hook, same subscribe pattern).

3. **Engineering**
   - Debounce typing indicator separately from chat send (Enter to send).
   - Sanitize message length server-side.
   - Rate limit messages per socket.

### Phase 7+ (After Chat)

| Phase | Feature |
|-------|---------|
| 7 | Code execution (sandbox API, output stream to `OutputPanel`) |
| 8 | Whiteboard (canvas + socket draw events) |
| 9 | Persistence (save editor snapshots / session to MongoDB) |
| 10 | Production (Redis adapter, env hardening, deployment) |

### When Continuing in a Fresh Chat

1. Read this file completely.
2. Run `server` + `client` dev servers; confirm two-user room + editor sync.
3. Do not re-scaffold Phases 1–5.
4. Extend `socketEvents.js` on **both** sides for new events.
5. Register new handlers in `connectionHandler.js`.
6. Add hooks with `enabled` gating tied to `accessReady` / `isJoined`.
7. Keep dark UI consistent with `tailwind.config.js` tokens.
8. Test: second user via **shared link** must be logged in and show **online** after fixes in Phase 3/4.

### Quick Command Reference

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

---

## Appendix A: Default C++ Template

Both client and server share the same default (keep in sync):

**Files:** `server/sockets/utils/defaultCode.js`, `client/src/utils/defaultCode.js`

```cpp
#include <iostream>
using namespace std;

int main() {
  cout << "CollabCPP — collaborative C++" << endl;
  return 0;
}
```

---

## Appendix B: Critical Path — User Opens Shared Room Link

```
1. User authenticated (JWT in localStorage)
2. Navigate /room/cpp-XXXXXX
3. ProtectedRoute passes
4. useRoom fetches GET /rooms/:id
   → 403? → ensureRoomMembership / client join retry
   → accessReady = true
5. useRoomSocket(enabled=true) → join_room
   → PARTICIPANTS_SYNC, EDITOR_CODE_SYNC
6. useCollaborativeEditor(enabled=true) → subscribe editor events
7. ParticipantsPanel merges DB participants + live socket (online dots)
```

Failure at step 4–5 causes **"no access"** and **offline** appearance for guest.

---

## Appendix C: File Edit Checklist for New Features

- [ ] `server/sockets/utils/socketEvents.js`
- [ ] `client/src/sockets/socketEvents.js`
- [ ] New handler under `server/sockets/handlers/`
- [ ] Register in `connectionHandler.js`
- [ ] Client hook with cleanup + `enabled` flag
- [ ] UI component in correct folder
- [ ] Update `healthController` phase number if releasing a phase
- [ ] Update this `MASTER_CONTEXT.md` section

---

*End of MASTER_CONTEXT.md*
