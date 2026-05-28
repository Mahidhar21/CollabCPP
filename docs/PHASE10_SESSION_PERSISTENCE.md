## PHASE 10 — Session Persistence

Implement persistent storage for collaborative interview sessions, transitioning CollabCPP from temporary real-time collaboration to durable persistent sessions.

---

## Overview

Phase 10 adds persistent storage for:
- **Room metadata** (title, ownership, participants)
- **Collaborative code state** (latest code)
- **Chat history** (all messages with timestamps/senders)
- **Whiteboard state** (drawing actions)
- **Activity tracking** (creation, last active)

The system uses a **smart debouncing strategy** to avoid excessive database writes while maintaining data integrity.

---

## Architecture

### Persistence Strategy

```
Three-tier persistence approach:

1. Debounced Writes (Backend)
   - Code: Batched every 5 seconds
   - Chat: Batched every 10 seconds
   - Whiteboard: Batched every 10 seconds
   - Prevents DB overload from rapid edits

2. Major Event Saves
   - On room join: Load previous session state
   - On user disconnect: Save current state
   - On room leave: Full session snapshot

3. API-Driven Persistence
   - Manual session saves on demand
   - Recent sessions retrieval for dashboard
   - Session loading for room access
```

### Database Model

```
Session {
  roomId: String (unique, indexed)
  title: String
  owner: ObjectId (ref User)
  participants: [{
    user: ObjectId,
    username: String,
    joinedAt: Date,
    lastActive: Date
  }]
  currentCode: String (max 100KB)
  chatHistory: [{
    sender: ObjectId,
    senderName: String,
    content: String,
    timestamp: Date
  }] (max 1000 messages)
  whiteboardData: [{
    type: DRAW|ERASE|CLEAR,
    x, y, x0, y0: Number,
    size: Number,
    timestamp: Date
  }] (max 10000 actions)
  createdAt: Date
  updatedAt: Date
  lastActive: Date (indexed for recent queries)
  isActive: Boolean (indexed)
}
```

### Debouncing Implementation

**Backend debouncing** uses in-memory timers per room:

```javascript
// Example: Code persistence
const debounceTimers = new Map(); // roomId -> timeoutId

function debounceCodeSave(roomId, code) {
  // Cancel existing timer for this room
  clearTimeout(debounceTimers.get(roomId));
  
  // Set new timer - save after 5 seconds
  const timeoutId = setTimeout(async () => {
    await updateSessionCode(roomId, code);
    debounceTimers.delete(roomId);
  }, 5000);
  
  debounceTimers.set(roomId, timeoutId);
}
```

**Benefits:**
- ✅ Avoids DB write on every keystroke
- ✅ Batches multiple changes together
- ✅ Saves pending changes on disconnect
- ✅ Low memory overhead (one timer per active room)

---

## API Endpoints

### GET /api/sessions/:roomId
Load saved session for a room.

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "CPP-ABC123",
    "title": "Mock Interview #1",
    "owner": { "id": "...", "username": "alice" },
    "currentCode": "...",
    "chatHistory": [...],
    "whiteboardData": [...],
    "lastActive": "2025-05-25T10:30:00Z"
  }
}
```

### POST /api/sessions/save
Persist current session state.

**Request:**
```json
{
  "roomId": "CPP-ABC123",
  "title": "Mock Interview #1",
  "owner": "userId",
  "participants": [...],
  "currentCode": "...",
  "chatHistory": [...],
  "whiteboardData": [...]
}
```

### GET /api/sessions/recent?limit=20
Fetch recent sessions for current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roomId": "CPP-ABC123",
      "title": "Mock Interview #1",
      "owner": { "username": "alice" },
      "createdAt": "2025-05-20T14:30:00Z",
      "lastActive": "2025-05-25T10:30:00Z",
      "participants": [...]
    }
  ],
  "count": 10
}
```

### DELETE /api/sessions/:roomId
Delete a session (owner only).

### PATCH /api/sessions/:roomId/deactivate
Mark session as inactive.

---

## Socket Events

### Client → Server

```javascript
// Debounced code change (batched at backend)
SESSION_CODE_CHANGE: 'session:code_change'
// { roomId, code }

// Debounced chat message (batched at backend)
SESSION_MESSAGE_ADD: 'session:message_add'
// { roomId, message: { senderId, senderName, content, timestamp } }

// Debounced whiteboard action (batched at backend)
SESSION_WHITEBOARD_ACTION: 'session:whiteboard_action'
// { roomId, action: { type, x, y, x0, y0, size, timestamp } }
```

### Server → Client

```javascript
SESSION_LOAD: 'session:load'        // Load initial session state
SESSION_SAVED: 'session:saved'      // Confirmation of save
SESSION_SAVE_FAILED: 'session:save_failed'  // Save error
```

---

## Frontend Hooks

### useSession(roomId, isActive)

```javascript
const {
  sessionData,        // Loaded session data
  loading,            // Loading state
  error,              // Error message
  saveStatus,         // 'idle' | 'saving' | 'saved' | 'error'
  lastSaved,          // Timestamp of last save
  persistCode,        // Function to persist code
  persistChatMessage, // Function to persist message
  persistWhiteboardAction, // Function to persist drawing
  saveSession,        // Manual save function
} = useSession(roomId, isActive);
```

### useRecentSessions()

```javascript
const {
  sessions,    // Array of recent sessions
  loading,     // Loading state
  error,       // Error message
} = useRecentSessions();
```

---

## Data Flow

### On Room Join
```
1. Client calls useSession hook
2. useSession makes GET /api/sessions/:roomId request
3. Backend returns saved session (or null if new)
4. Frontend receives: currentCode, chatHistory, whiteboardData
5. Components load and render restored state
6. Backend registers socket handlers for this room
```

### During Session
```
1. User edits code
2. Editor change triggers CODE_CHANGE event
3. RoomPage calls persistCode() 
4. Socket emits SESSION_CODE_CHANGE event
5. Backend receives, starts 5s debounce timer
6. If more edits arrive within 5s, timer resets
7. After 5s silence, backend saves to DB
8. Session.currentCode updated in MongoDB
```

### On Room Leave
```
1. useEffect cleanup triggered
2. RoomPage calls saveSession() with full state
3. POST /api/sessions/save sent to backend
4. Backend creates/updates Session document
5. All changes persisted to MongoDB
6. Session marked active
```

### On Disconnect
```
1. Socket disconnects
2. connectionHandler cleanup
3. clearSessionDebounceTimers() clears pending saves
4. Pending debounce timers execute their final saves
5. All recent data persisted before socket closes
```

---

## Implementation Files

### Backend
- `server/models/Session.js` — Mongoose schema
- `server/services/sessionService.js` — Persistence logic
- `server/controllers/sessionController.js` — API handlers
- `server/routes/sessionRoutes.js` — Route definitions
- `server/sockets/handlers/sessionSocket.js` — Socket handlers with debouncing
- `server/routes/index.js` — Updated to mount session routes
- `server/sockets/handlers/connectionHandler.js` — Updated to register session handlers

### Frontend
- `client/src/hooks/useSession.js` — Session persistence hooks
- `client/src/hooks/useWhiteboard.js` — Already exists, used for drawing
- `client/src/components/room/SessionStatus.jsx` — Save status indicator
- `client/src/components/rooms/RecentSessionsList.jsx` — Recent sessions UI
- `client/src/pages/RoomPage.jsx` — Integrated persistence
- `client/src/pages/DashboardPage.jsx` — Updated with recent sessions
- `client/src/sockets/socketEvents.js` — Added session events

---

## Performance Considerations

### Database
- **Debouncing reduces writes by ~90%**
  - Instead of 100+ writes/minute during typing, only 12 writes/minute
  - Typical session: ~50 saves/hour instead of thousands

- **Indexes optimize queries**
  - `{ owner: 1, lastActive: -1 }` — Fast "recent sessions" queries
  - `{ isActive: 1, lastActive: -1 }` — Fast "active sessions" queries
  - `{ 'participants.user': 1 }` — Fast participation lookups

- **Array limits prevent bloat**
  - chatHistory: max 1000 messages (rare to reach)
  - whiteboardData: max 10000 actions (rarely reached in practice)

### Memory
- **In-memory debounce timers**
  - 1 timer per active room per type (code/chat/whiteboard)
  - Typical: ~100 bytes per timer
  - 1000 active rooms = ~300KB memory overhead

### Network
- **Minimal additional bandwidth**
  - Session load: ~50-100KB per session (mostly code)
  - Debounced writes: ~1-5KB per save
  - Only sent every 5-10 seconds, not per keystroke

---

## Testing Checklist

### Backend Tests
- [ ] Session schema validates correctly
- [ ] saveSession() creates/updates properly
- [ ] loadSession() retrieves correct data
- [ ] getRecentSessions() returns sorted list
- [ ] Debounce timers work correctly (code, chat, whiteboard)
- [ ] clearSessionDebounceTimers() cleans up on disconnect
- [ ] API endpoints return correct responses
- [ ] Authorization checks work (owner-only operations)

### Frontend Tests
- [ ] useSession hook loads session on mount
- [ ] persistCode() emits correct socket event
- [ ] persistChatMessage() works for new messages
- [ ] persistWhiteboardAction() works for drawing
- [ ] SessionStatus shows saving/saved/error states
- [ ] RecentSessionsList displays sessions correctly
- [ ] DashboardPage loads recent sessions
- [ ] Room leave triggers full session save
- [ ] No errors when session doesn't exist yet

### Integration Tests
- [ ] Join room → session loads
- [ ] Edit code → appears in next load
- [ ] Send message → persists in history
- [ ] Draw on whiteboard → persists
- [ ] Leave room → data saved
- [ ] Rejoin room → previous state restored
- [ ] Multiple users in room → all changes persisted
- [ ] Network interruption → debounce timers still fire

---

## Future Enhancements

1. **Session Versioning**
   - Store code/board history for undo/redo
   - Track edit timeline

2. **Collaborative Awareness**
   - Show "currently editing" indicators per participant
   - Track who changed what

3. **Export Sessions**
   - Export code, chat, and whiteboard as PDF/HTML
   - Archive sessions for portfolio

4. **Session Sharing**
   - Share read-only session snapshots
   - Public session viewing

5. **Analytics**
   - Track session duration, participant count
   - Generate performance metrics

---

## Troubleshooting

### Sessions not saving
1. Check MongoDB connection in server logs
2. Verify user authentication token is valid
3. Check browser console for failed API requests
4. Monitor debounce timer execution

### Slow session loading
1. Check MongoDB indexes exist
2. Monitor query performance
3. Consider archiving old sessions to separate collection

### Memory leak
1. Verify debounce timers cleared on disconnect
2. Check socket handler subscriptions are cleaned up
3. Monitor nodejs memory with `node --expose-gc`

---

## Configuration

### Debounce Intervals (adjustable in sessionSocket.js)
```javascript
CODE_SAVE_DEBOUNCE = 5000ms     // 5 seconds
CHAT_SAVE_DEBOUNCE = 10000ms    // 10 seconds
WHITEBOARD_DEBOUNCE = 10000ms   // 10 seconds
```

### Array Limits (in Session.js schema)
```javascript
chatHistory.maxlength = 1000
whiteboardData.maxlength = 10000
```

### API Pagination (in sessionController.js)
```javascript
DEFAULT_LIMIT = 20
MAX_LIMIT = 100
```

---
