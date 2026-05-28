# CollabCPP

Realtime collaborative C++ interview platform — **MERN stack**.

## Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React, Vite, TailwindCSS, React Router, Axios, Zustand |
| Backend  | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |
| Realtime | Socket.IO (Phase 4 foundation) |

## Setup

```bash
# Backend
cd server && npm install && npm run dev

# Frontend
cd client && npm install && npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | App |
| http://localhost:5173/dashboard | Room dashboard |
| http://localhost:5173/room/cpp-XXXXXX | Interview room |
| http://localhost:5000/api | API |

## Environment variables

**server/.env** — `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`  
**client/.env** — `VITE_API_URL=http://localhost:5000/api`

**client/.env** — add `VITE_SOCKET_URL=http://localhost:5000` (optional; defaults to same host)

## Phase 4 — Socket.IO Foundation

### Architecture

- Socket.IO attaches to the same HTTP server as Express
- JWT auth on handshake (`auth.token`)
- Room channels via `socket.join(roomId)` — no global broadcasts
- In-memory presence store (Redis-ready for scale later)

### Socket events

| Direction | Event | Description |
|-----------|-------|-------------|
| C→S | `join_room` | Join Socket.IO room + presence |
| C→S | `leave_room` | Leave room + cleanup |
| S→C | `connection_ack` | Connection confirmed |
| S→C | `room:participants_sync` | Full online list |
| S→C | `room:participant_joined` | User joined |
| S→C | `room:participant_left` | User left |
| S→C | `room:error` | Room access errors |

### Server socket layout

```
server/sockets/
  index.js              # IO init + CORS
  roomSocket.js         # join/leave handlers
  handlers/
    connectionHandler.js
  utils/
    socketEvents.js
    participantStore.js
    socketAuth.js
    roomAccess.js
```

### Client socket layout

```
client/src/sockets/
  socketClient.js       # Singleton connection
  socketEvents.js
client/src/store/useSocketStore.js
client/src/hooks/useRoomSocket.js
```

### Testing presence (two browsers)

1. Start server + client
2. User A: create room → enter `/room/cpp-XXXXXX`
3. User B: join same room ID
4. Both should see each other in **Participants** with green online indicators
5. Header shows **Live** connection status
6. Closing a tab removes that user from the list (disconnect cleanup)

## Phase 5 — Collaborative Monaco Editor

### Install

```bash
cd client && npm install
```

Adds `@monaco-editor/react` and `monaco-editor`.

### Socket event flow

```
User types locally
  → debounced code_change (120ms) → server updates room state
  → editor:code_change to room (excludes sender)

User joins room
  → editor:code_sync (full code + cursors + typers)

Cursor moves
  → throttled cursor_move (80ms) → editor:cursor_move to room

Typing
  → typing_start → editor:typing_update
  → auto typing_stop after 2s idle
```

### Loop prevention

Remote updates set `isApplyingRemoteRef` so `onChange` does not re-emit. Incoming events include `origin.userId` — own events are ignored.

### Test (two browsers)

1. Both users in same room, both signed in
2. Type in one editor — other updates within ~120ms
3. Move cursor — remote label appears on other screen
4. Typing indicator shows username in editor toolbar

## Phase 3 — Rooms

### Room API (all require `Authorization: Bearer <token>`)

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/api/rooms/create` | `{ title }` | Create room → `cpp-XXXXXX` ID |
| POST | `/api/rooms/join` | `{ roomId }` | Join existing room |
| GET | `/api/rooms/recent` | — | User's recent sessions |
| GET | `/api/rooms/:roomId` | — | Room metadata (participants only) |

Room IDs are human-readable (e.g. `cpp-7F3K2A`), not MongoDB ObjectIds.

### Frontend routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Create/join rooms, recent sessions |
| `/room/:roomId` | Room workspace skeleton (editor, chat, whiteboard placeholders) |

## Testing (curl)

```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","password":"password123"}' | jq -r '.data.token')

# Create room
curl -X POST http://localhost:5000/api/rooms/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"C++ Systems Interview"}'

# Join room
curl -X POST http://localhost:5000/api/rooms/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"cpp-XXXXXX"}'

# Recent rooms
curl http://localhost:5000/api/rooms/recent \
  -H "Authorization: Bearer $TOKEN"
```

## Phase roadmap

| Phase | Status | Features |
|-------|--------|----------|
| 1 | Done | Architecture, health API |
| 2 | Done | JWT auth |
| 3 | Done | Rooms, dashboard, room layout skeleton |
| 4 | Done | Socket.IO presence, join/leave, realtime participants |
| 5 | Done | Collaborative Monaco editor, cursors, typing indicators |
| 6 | Planned | Chat, whiteboard, code execution |

## License

MIT
