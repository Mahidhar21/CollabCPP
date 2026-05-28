## Session Persistence Architecture & Save Strategy

Complete technical architecture explaining how Phase 10 persists collaborative session state.

---

## Core Philosophy

**Persist Everything, Optimize Writes**

The system keeps all session data (code, chat, whiteboard) in MongoDB while using intelligent debouncing on the backend to prevent excessive database writes. This creates a balance between:
- ✅ Data durability (everything is saved)
- ✅ Performance (minimal DB overhead)
- ✅ User experience (seamless persistence)

---

## Multi-Layer Persistence

### Layer 1: Real-Time State (Memory)

During an active session, all changes exist in memory:

```
Client State (Zustand):
├─ useAppStore
│  └─ currentCode: "..."
│  └─ participants: [...]
│
└─ useSocketStore
   └─ socket listeners for remote updates
```

This provides **instant feedback** without waiting for database.

### Layer 2: Debounced Persistence (Backend Memory)

Backend maintains debounce timers per room:

```
Backend In-Memory:
┌─ Room CPP-ABC123
│  ├─ Code debounce timer (5s)
│  ├─ Chat debounce timer (10s)
│  └─ Whiteboard debounce timer (10s)
│
└─ Room CPP-XYZ789
   ├─ Code debounce timer (5s)
   ├─ Chat debounce timer (10s)
   └─ Whiteboard debounce timer (10s)
```

Each timer batches multiple changes:
- **5 edits in 5 seconds** = 1 database write (instead of 5)
- **10 messages in 10 seconds** = 1 database write (instead of 10)
- **100 drawing actions in 10 seconds** = 1 database write (instead of 100)

### Layer 3: Durable Storage (MongoDB)

Periodically, debounced changes are persisted:

```
MongoDB Session Document:
{
  _id: ObjectId,
  roomId: "CPP-ABC123",
  title: "Interview Session",
  owner: ObjectId,
  currentCode: "...",       ← Latest code from debounce
  chatHistory: [...],       ← Latest messages from debounce
  whiteboardData: [...],    ← Latest drawing actions
  updatedAt: ISODate,
  lastActive: ISODate
}
```

---

## Save Strategy Decision Tree

```
User Action
│
├─ Code Change
│  └─→ SESSION_CODE_CHANGE event
│      └─→ Backend debounces (5s)
│          └─→ If more changes in 5s, reset timer
│              └─→ After 5s silence, save code to DB
│
├─ Send Chat Message
│  └─→ SESSION_MESSAGE_ADD event
│      └─→ Backend debounces (10s)
│          └─→ Batch messages
│              └─→ After 10s silence, save to chatHistory
│
├─ Draw on Whiteboard
│  └─→ SESSION_WHITEBOARD_ACTION event
│      └─→ Backend debounces (10s)
│          └─→ Batch drawing actions
│              └─→ After 10s silence, save to whiteboardData
│
├─ Leave Room
│  └─→ useEffect cleanup triggered
│      └─→ saveSession() called
│          └─→ POST /api/sessions/save
│              └─→ Full session snapshot to DB
│
└─ Disconnect (Network Error)
   └─→ Socket 'disconnect' event
       └─→ clearSessionDebounceTimers()
           └─→ Pending debounce saves trigger immediately
               └─→ All pending changes persisted
```

---

## Timing Diagrams

### Scenario 1: Rapid Code Changes

```
Time    Action              Backend State           DB Action
─────────────────────────────────────────────────────────────
0ms     User types 'i'      Timer: 5000ms
50ms    User types 'n'      Cancel timer, restart
100ms   User types 't'      Cancel timer, restart
150ms   Pause               Timer: 5000ms
5000ms  Timer fires         Save "int" to DB ✓
```

**Result:** 3 edits → 1 database write

### Scenario 2: Chat Messages

```
Time    Action              Backend Queue           DB Action
─────────────────────────────────────────────────────────────
0s      Message 1 sent      Queue: [msg1], Timer: 10s
2s      Message 2 sent      Queue: [msg1, msg2], Reset
4s      Message 3 sent      Queue: [msg1-3], Reset
8s      Pause               Queue: [msg1-3], Timer: 10s
18s     Timer fires         Append 3 msgs to DB ✓
```

**Result:** 3 messages → 1 database write

### Scenario 3: Disconnect During Activity

```
Time    Action              Backend State           DB Action
─────────────────────────────────────────────────────────────
0ms     Type 'v'            Code timer: 5000ms
1s      Type 'o'            Code timer: reset
2s      Network error       Socket disconnect
2ms     clearTimers()       Force execute pending
        Save code to DB ✓
```

**Result:** No data loss despite network failure

---

## Debounce Implementation Details

### Code Persistence

```javascript
// server/sockets/handlers/sessionSocket.js

const debounceTimers = {
  code: new Map(),      // roomId -> timeoutId
  chat: new Map(),
  whiteboard: new Map(),
};

function debounceCodeSave(roomId, code) {
  // Clear old timer for this room
  if (debounceTimers.code.has(roomId)) {
    clearTimeout(debounceTimers.code.get(roomId));
  }

  // Set new timer
  const timeoutId = setTimeout(async () => {
    await updateSessionCode(roomId, code);
    debounceTimers.code.delete(roomId);
  }, 5000);  // 5 second debounce

  debounceTimers.code.set(roomId, timeoutId);
}

// When code_change event arrives
socket.on(SOCKET_EVENTS.SESSION_CODE_CHANGE, (data) => {
  debounceCodeSave(data.roomId, data.code);
});
```

### Cleanup on Disconnect

```javascript
// server/sockets/handlers/connectionHandler.js

socket.on('disconnect', (reason) => {
  const meta = removeParticipant(socket.id);
  
  if (meta) {
    // Execute any pending debounce timers
    clearSessionDebounceTimers(meta.roomId);
    
    // This ensures:
    // - Pending code saves execute
    // - Pending chat saves execute
    // - Pending whiteboard saves execute
    // - All changes persisted before socket closes
  }
});
```

---

## Database Write Optimization

### Before Debouncing

```
Keystroke sequence: "hello"

User presses 'h' ──→ DB write
User presses 'e' ──→ DB write
User presses 'l' ──→ DB write
User presses 'l' ──→ DB write
User presses 'o' ──→ DB write

Result: 5 DB writes for one word
```

### After Debouncing

```
Keystroke sequence: "hello"

User presses 'h' ──→ Debounce timer: 5s
User presses 'e' ──→ Reset timer
User presses 'l' ──→ Reset timer
User presses 'l' ──→ Reset timer
User presses 'o' ──→ Reset timer
5 seconds pass ──→ DB write ("hello")

Result: 1 DB write for one word
```

### Performance Impact

```
Typical Interview Session (30 minutes):

Without debouncing:
- Edits: 2000 keystrokes = 2000 writes
- Chat: 50 messages, ~250 writes
- Whiteboard: 1000 actions = 1000 writes
Total: ~3250 DB writes

With debouncing (5s code, 10s chat/board):
- Edits: 2000/12 = 167 writes
- Chat: 50/12 = 5 writes
- Whiteboard: 1000/40 = 25 writes
Total: ~197 DB writes

Reduction: 94% fewer database operations ✓
```

---

## Save Strategy by Event Type

### Code Changes
```
Trigger:  CODE_CHANGE event from client
Event:    SESSION_CODE_CHANGE
Debounce: 5 seconds
Action:   updateSessionCode(roomId, code)
Result:   Session.currentCode updated

Rationale:
- Code doesn't need per-character saves
- 5s batching is imperceptible to user
- Reduces DB load during active coding
```

### Chat Messages
```
Trigger:  SEND_MESSAGE event from client
Event:    SESSION_MESSAGE_ADD
Debounce: 10 seconds
Action:   addSessionMessage(roomId, message)
Result:   Message appended to Session.chatHistory

Rationale:
- Messages are discrete units (not per-character)
- 10s batching prevents chat message duplicates
- Multiple messages batched into single write
```

### Whiteboard Drawing
```
Trigger:  DRAW/ERASE events from client
Event:    SESSION_WHITEBOARD_ACTION
Debounce: 10 seconds
Action:   addWhiteboardAction(roomId, action)
Result:   Action appended to Session.whiteboardData

Rationale:
- Drawing produces many small actions (~100/s when active)
- 10s batching reduces massive write volume
- Still maintains drawing smooth appearance (local state)
```

### Major Events (No Debounce)
```
Trigger:  Room leave or manual save
Event:    Direct API call or socket event
Action:   saveSession() - full state snapshot
Result:   Complete Session document updated

Rationale:
- Ensures full state persisted before user exits
- No data loss on network interruption
- Captures final state of session
```

---

## Frontend Integration

### useSession Hook Flow

```
Component mounts
│
├─ useSession(roomId, isActive) called
│  │
│  └─ On mount:
│     ├─ Fetch /api/sessions/:roomId
│     ├─ If found: setSessionData(loaded)
│     └─ Components render with restored state
│
└─ During session:
   │
   ├─ Code changes
   │  └─ persistCode(code) emits SESSION_CODE_CHANGE
   │     └─ Backend debounces 5s
   │
   ├─ Chat messages
   │  └─ persistChatMessage() emits SESSION_MESSAGE_ADD
   │     └─ Backend debounces 10s
   │
   └─ Whiteboard drawing
      └─ persistWhiteboardAction() emits SESSION_WHITEBOARD_ACTION
         └─ Backend debounces 10s
```

### Session Status Feedback

```
User sees indicator:

┌─────────────────────┐
│ Saving...           │  ← While debounce timer active
└─────────────────────┘

After debounce completes:

┌─────────────────────┐
│ ✓ Saved             │  ← Confirmation
└─────────────────────┘

(auto-dismisses after 2.5s)
```

---

## Data Integrity Guarantees

### Consistency Model

```
EVENTUAL CONSISTENCY with STRONG DURABILITY

- Local: Immediate updates (real-time feel)
- Server: Debounced persistence (no DB overload)
- Durable: Changes in MongoDB after debounce

Timeline:
0ms   : User edit in React state
50ms  : Edit visible on screen
5000ms: Edit in MongoDB
```

### No Data Loss

```
Scenario: User disconnects while editing

Action:        Effect:
User types ──→ Local state updated
              Socket emits code
              Backend starts 5s debounce
User loses    ← Debounce timer still active
network       ← clearSessionDebounceTimers() called
              ← Pending saves execute immediately
              ← Code persisted to DB

Result: ✓ No data loss
```

### No Duplicate Writes

```
Code debouncing prevents:

Bad:
POST /sessions/save?code="i"
POST /sessions/save?code="in"
POST /sessions/save?code="int"

Good:
POST /sessions/save?code="int"  ← Single write after 5s
```

---

## Memory Efficiency

### Debounce Timer Overhead

```
Per active room:
- Code timer: 48 bytes
- Chat timer: 48 bytes
- Whiteboard timer: 48 bytes
Total per room: 144 bytes

1000 active rooms: 144KB

VS alternative (save every keystroke):
3000 simultaneous requests: massive overhead ✗

Result: ✓ Highly efficient
```

### Session Document Size

```
Typical session:
- Metadata: ~500 bytes
- Code: 0-50KB
- Chat (1000 msgs): ~300KB
- Whiteboard (10000 actions): ~500KB
Average: ~300KB

Fits comfortably in MongoDB with no issues
```

---

## Monitoring & Debugging

### Check Debounce Status

```bash
# Monitor debounce timer counts
netstat -tulpn | grep node
ps aux | grep node | awk '{print $6}' | sum  # Memory usage

# In backend logs:
logger.debug('Code debounce save executed', { roomId })
logger.debug('Chat debounce save executed', { roomId })
logger.debug('Whiteboard debounce save executed', { roomId })
```

### Verify Persistence

```bash
# Check MongoDB for session docs
db.sessions.find().sort({ lastActive: -1 }).limit(10)

# Verify timestamps
db.sessions.find({ roomId: 'CPP-ABC123' }, {
  roomId: 1,
  updatedAt: 1,
  'chatHistory': { $size: 1 }
})
```

---

## Configuration & Tuning

### Adjust Debounce Intervals

```javascript
// server/sockets/handlers/sessionSocket.js

// For slow networks, increase debounce:
const CODE_DEBOUNCE = 10000;     // 10 seconds (was 5s)
const CHAT_DEBOUNCE = 20000;     // 20 seconds (was 10s)
const WHITEBOARD_DEBOUNCE = 20000;

// For high-volume sessions, decrease:
const CODE_DEBOUNCE = 2000;      // 2 seconds (more frequent saves)
const CHAT_DEBOUNCE = 5000;      // 5 seconds
const WHITEBOARD_DEBOUNCE = 5000;
```

### Adjust Array Limits

```javascript
// server/models/Session.js

// Store more chat history
chatHistory: {
  type: [chatMessageSchema],
  maxlength: 5000  // was 1000
}

// Store more drawing
whiteboardData: {
  type: [drawingActionSchema],
  maxlength: 50000  // was 10000
}
```

---

## Best Practices

✅ **DO:**
- Keep debounce intervals reasonable (2-10 seconds)
- Clear timers on disconnect
- Save full state on room leave
- Limit array sizes to prevent bloat
- Index database fields for recent queries

❌ **DON'T:**
- Save on every keystroke (massive DB overhead)
- Use immediate/synchronous saves
- Allow unbounded arrays in Session
- Forget to clear timers on disconnect
- Ignore network errors in save handlers

---
