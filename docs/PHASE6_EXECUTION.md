# Phase 6 — C++ Code Execution Engine — Implementation Guide

## Overview

Phase 6 implements secure C++ code compilation and execution within CollabCPP. Users can:
- Write C++ code in the shared Monaco Editor
- Click "Run" to compile and execute
- See real-time compilation/runtime errors and output
- Results broadcast to all room participants

---

## Architecture

### Backend Flow

```
Client emits: execute_code { roomId, code }
    ↓
Server validates room membership
    ↓
executeCode() orchestrator:
  1. Create temp directory
  2. Write code to main.cpp
  3. Compile with g++ (10s timeout)
  4. If compile success: execute binary (30s timeout)
  5. Capture stdout/stderr
  6. Cleanup temp files
  7. Return structured result
    ↓
Server broadcasts: execution:output { result, executedBy, timestamp }
    ↓
Client receives in all room sockets
    ↓
OutputPanel displays result
```

### Backend Services

**`server/services/codeExecution/`** (new modular structure):

- **`index.js`** — Main orchestrator (`executeCode` function)
- **`compileCpp.js`** — g++ compilation logic, error capture, timeout
- **`processManager.js`** — Binary execution with timeout/resource limits
- **`tempFileManager.js`** — Temp directory/file creation and cleanup

**`server/sockets/handlers/`** (new):

- **`executionSocket.js`** — Handles `execute_code` socket event, broadcasts results

**`server/controllers/codeController.js`** (new):

- REST endpoint fallback: `POST /api/code/execute`

**`server/routes/codeRoutes.js`** (new):

- Routes registration: `/api/code`

### Socket Events (NEW)

**Client → Server:**
- `execute_code` — `{ roomId, code }`

**Server → Client (to room):**
- `execution:output` — `{ result, executedBy, timestamp }`
- `execution:error` — Error messages (fallback)

### Frontend

**`client/src/hooks/useCodeExecution.js`** (new):
- Manages execution lifecycle
- Emits `execute_code` socket event
- Subscribes to `execution:output`
- Returns `{ executeCode, isExecuting, executionOutput, executionError }`

**`client/src/components/room/OutputPanel.jsx`** (replaced):
- Displays compilation status (success/failure, timing)
- Shows compile errors with syntax highlighting
- Displays runtime errors or stdout
- Terminal-like styling (dark, monospace, syntax colors)

**`client/src/components/room/EditorPanel.jsx`** (updated):
- Added "Run" button to toolbar
- Button disabled while executing
- Passes `onRunCode` callback to parent

**`client/src/pages/RoomPage.jsx`** (updated):
- Integrates `useCodeExecution` hook
- Passes execution props to EditorPanel + OutputPanel

### Frontend Socket Integration

**`client/src/sockets/socketEvents.js`** (updated):
- Added `EXECUTE_CODE`, `EXECUTION_OUTPUT`, `EXECUTION_ERROR`

**`client/src/sockets/socketClient.js`** (updated):
- Added `emitEvent(event, data, callback)` for generic socket emit

**`client/src/store/useSocketStore.js`** (updated):
- Exposed `emit(event, data, callback)` method
- Exposed `socketClient` getter

---

## Security & Cleanup

### Timeout Protection

- **Compilation:** 10s timeout (default)
- **Execution:** 30s timeout (default)
- SIGTERM + SIGKILL escalation after 2s

### Resource Limits

- **Output:** 10MB cap (prevents memory overflow)
- **Errors:** 1MB cap
- Code size: 100KB max (API validation)

### File Cleanup

- Always cleanup temp directories (recursive `fs.rm` with `force: true`)
- Cleanup on success, error, or timeout
- Failures logged but don't crash execution

### Shell Safety

- Uses `spawn()` (not `exec()`) — no shell injection
- Arguments passed as array, not string
- Temp files isolated in unique directories

### Compilation Flags

```bash
g++ -o <binary> <source> -std=c++17 -Wall -Wextra
```

- C++17 standard
- Warnings enabled (catches common errors)

---

## Installation & Setup

### 1. Prerequisites

**Linux/Mac:**
```bash
# g++ usually pre-installed
which g++
g++ --version  # Should be 7+ (C++17 support)
```

**Windows:**
- Install MinGW-w64 (includes g++)
- Add to PATH
- Verify: `g++ --version` in PowerShell

### 2. Backend Setup

No new npm packages required — uses Node built-ins:
- `child_process` (spawn)
- `fs` (promises API)
- `os` (tmpdir)
- `crypto` (randomBytes)
- `path` (file paths)

### 3. Frontend Setup

Already bundled (no new packages):
- Socket.IO Client (existing)
- React hooks (existing)

### 4. Environment Validation

**server/.env** (already set)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/collabcpp
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

**client/.env** (already set)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Testing

### 1. Start Servers

**Terminal 1 — Backend:**
```bash
cd server
npm install  # (if not done)
npm run dev  # Starts on :5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install  # (if not done)
npm run dev  # Starts on :5173
```

### 2. Two-User Setup

**Browser 1:** `http://localhost:5173`
- Sign up: `user1@test.com` / `pass1`
- Create room "Test Execution"
- Share room link

**Browser 2 (incognito):** `http://localhost:5173`
- Sign up: `user2@test.com` / `pass2`
- Open shared link (or join room ID)

### 3. Test Cases

#### Test 1: Simple Output
**Code:**
```cpp
#include <iostream>
using namespace std;

int main() {
  cout << "Hello from CollabCPP!" << endl;
  return 0;
}
```

**Expected:**
- ✓ Compilation succeeds
- ✓ Execution shows: "Hello from CollabCPP!"
- ✓ Both users see output

#### Test 2: Compile Error
**Code:**
```cpp
#include <iostream>

int main() {
  cout << "Missing semicolon"
  return 0;
}
```

**Expected:**
- ✗ Compilation fails
- Shows error: "error: expected ';' before 'return'"
- Execution doesn't run

#### Test 3: Runtime Error
**Code:**
```cpp
#include <iostream>
using namespace std;

int main() {
  int arr[5] = {1, 2, 3, 4, 5};
  cout << arr[10] << endl;  // Out of bounds
  return 0;
}
```

**Expected:**
- ✓ Compilation succeeds
- ⚠ Execution may crash (undefined behavior — depends on OS/compiler)
- Shows exit code non-zero

#### Test 4: Timeout
**Code:**
```cpp
#include <iostream>
using namespace std;

int main() {
  while (true) {
    // Infinite loop
  }
  return 0;
}
```

**Expected:**
- ✓ Compilation succeeds
- ✗ Execution times out after 30s
- Shows: "Process exceeded time limit"

#### Test 5: Large Output
**Code:**
```cpp
#include <iostream>
using namespace std;

int main() {
  for (int i = 0; i < 1000000; i++) {
    cout << "Line " << i << endl;
  }
  return 0;
}
```

**Expected:**
- ✓ Compilation succeeds
- Output capped at 10MB
- Shows: "[Output truncated — exceeded 10MB limit]"

#### Test 6: Multi-User
**Steps:**
1. User1 clicks "Run" with test code
2. User2 should see output appear immediately
3. Both users see "executed by user1"
4. User2 can then execute their own code

**Expected:**
- ✓ Broadcast works
- ✓ Both see all executions
- ✓ Proper attribution

---

## File Locations & Structure

```
server/
├── services/codeExecution/     (NEW)
│   ├── index.js                ← Main orchestrator
│   ├── compileCpp.js           ← Compile logic
│   ├── processManager.js       ← Execute logic
│   └── tempFileManager.js      ← File management
├── sockets/
│   ├── handlers/
│   │   ├── connectionHandler.js    (UPDATED - registers execution)
│   │   ├── editorSocket.js
│   │   └── executionSocket.js      (NEW)
│   ├── utils/
│   │   └── socketEvents.js         (UPDATED - added execution events)
│   └── ...
├── controllers/
│   ├── codeController.js       (NEW - REST fallback)
│   └── ...
├── routes/
│   ├── codeRoutes.js           (NEW)
│   ├── index.js                (UPDATED - registers /code)
│   └── ...
└── ...

client/
├── src/
│   ├── hooks/
│   │   ├── useCodeExecution.js (NEW)
│   │   └── ...
│   ├── components/
│   │   ├── room/
│   │   │   ├── OutputPanel.jsx     (UPDATED - full implementation)
│   │   │   ├── EditorPanel.jsx     (UPDATED - added Run button)
│   │   │   └── ...
│   │   └── ...
│   ├── pages/
│   │   ├── RoomPage.jsx        (UPDATED - integrated execution)
│   │   └── ...
│   ├── sockets/
│   │   ├── socketEvents.js     (UPDATED - added events)
│   │   ├── socketClient.js     (UPDATED - added emitEvent)
│   │   └── ...
│   ├── store/
│   │   ├── useSocketStore.js   (UPDATED - expose emit/socketClient)
│   │   └── ...
│   └── ...
```

---

## Execution Flow Details

### Compile Phase

**Input:** source code (max 100KB)

**Process:**
1. Write to `/tmp/collabcpp-{timestamp}-{random}/main.cpp`
2. Spawn: `g++ -o ./main -std=c++17 -Wall -Wextra main.cpp`
3. Collect stderr while process runs
4. Set 10s timeout
5. On close: check exit code (0 = success, else fail)

**Output:** 
```javascript
{
  success: boolean,
  stderr: string,
  compileTime: number (ms)
}
```

**Errors captured:**
- Syntax errors
- Type errors
- Linker errors
- Timeout
- g++ not found (`ENOENT`)

### Execution Phase

**Input:** compiled binary

**Process:**
1. Spawn binary from temp directory
2. Collect stdout + stderr separately
3. Set 30s timeout
4. Monitor output size (cap 10MB stdout, 1MB stderr)
5. On close: check exit code

**Output:**
```javascript
{
  stdout: string,
  stderr: string,
  runtimeSuccess: boolean,
  executionTime: number (ms),
  timedOut: boolean
}
```

### Cleanup Phase

**Always executes:**
- `fs.rm(tempDir, { recursive: true, force: true })`
- Removes entire temp directory
- Catches errors and logs (non-fatal)

**Prevents:**
- Orphan processes (kill escalation)
- Orphan files (force recursive delete)
- Resource leaks (finally block)

---

## Debugging

### Server Logs

Look for `[CodeExecution]` prefix in logs:

```
[CodeExecution] Creating temp directory: /tmp/collabcpp-1716432000-abc123
[CodeExecution] Compiling /tmp/collabcpp-1716432000-abc123/main.cpp
[CodeExecution] Compilation successful (45ms)
[CodeExecution] Executing /tmp/collabcpp-1716432000-abc123/main
[CodeExecution] Execution completed (120ms, timedOut: false)
[CodeExecution] Cleaning up temp directory: /tmp/collabcpp-1716432000-abc123
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "g++: command not found" | g++ not installed or not in PATH | Install g++, verify `which g++` |
| "Access denied" temp files | Permissions issue | Check `/tmp` permissions, use different tmpdir |
| "Port 5000 already in use" | Another process using port | Kill process or change `PORT` in `.env` |
| "Socket not connected" | Frontend connects before backend ready | Ensure server starts first |
| Execution hangs | Infinite loop | 30s timeout should kill; check process manager |
| No broadcast to other user | Socket not in room | Verify both users joined via socket (`join_room` ack) |

### Testing Socket Events

**Backend — Use socket.io-client in Node:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' },
});

socket.emit('execute_code', { roomId: 'cpp-ABC123', code: '...' }, (ack) => {
  console.log('Ack:', ack);
});

socket.on('execution:output', (data) => {
  console.log('Output:', data);
});
```

### Frontend Console

**Browser console** (`F12 → Console`):

```javascript
// Get socket client
const socketClient = useSocketStore.getState().socketClient;
console.log('Socket connected:', socketClient.connected);
console.log('Socket id:', socketClient.id);

// Emit manually (for debugging)
socketClient.emit('execute_code', { roomId: 'cpp-ABC123', code: '...' });
```

---

## Performance Notes

- **Compile**: 50–500ms (depends on code complexity)
- **Execute**: milliseconds to seconds (depends on program)
- **Broadcast**: <50ms to all room sockets
- **UI updates**: immediate (React state update)

### Optimization Opportunities (Phase 7+)

- Compile cache (avoid recompiling same code)
- Precompile headers (reduce compile time)
- Worker threads (prevent server blocking)
- Redis pub/sub (multi-server broadcast)
- Persistence (save execution history to MongoDB)

---

## Next Steps (Phase 7+)

1. **Chat** — Realtime messaging in room
2. **Execution History** — Persist results to MongoDB
3. **Code Snippets** — Save/load code templates
4. **Collabor ative Debugging** — Breakpoints, step-through (complex)
5. **Whiteboard** — Canvas drawing with socket sync
6. **Code Analysis** — Static analysis, style checking

---

## Handoff Notes

- **No TypeScript** — Maintain JavaScript consistency
- **No Docker** — Local development only (documented in README)
- **In-memory state only** — Server restart clears execution history
- **Single-server** — No Redis adapter (yet)
- **Socket-first** — REST `/api/code/execute` is fallback only

All implementations follow existing MASTER_CONTEXT.md conventions:
- Modular handlers in `sockets/handlers/`
- Reusable services in `services/`
- Centralized event names in `socketEvents.js`
- Zustand for client state
- Comprehensive cleanup and error handling

---

**Ready for Phase 7 — Realtime Chat!**
