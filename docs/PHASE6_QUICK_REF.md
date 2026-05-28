# PHASE 6 — Quick Reference

## WHAT WAS BUILT

✅ **Full C++ Code Execution Engine** — Users can compile and run C++ code in real-time with output visible to all room participants.

---

## KEY FEATURES

1. **Secure Compilation** — g++ with C++17, warnings enabled, 10s timeout
2. **Monitored Execution** — 30s timeout, output caps (10MB stdout, 1MB stderr)
3. **Real-time Broadcast** — All users see execution results instantly
4. **Error Display** — Compilation errors, runtime crashes, timeouts all handled
5. **File Safety** — Automatic cleanup of temp directories and binaries
6. **Terminal UI** — Dark-themed, monospace output console with status indicators

---

## FILES AT A GLANCE

### Backend Services
```
server/services/codeExecution/
├── index.js          → orchestrates compile + execute + cleanup
├── compileCpp.js     → g++ invocation, error capture
├── processManager.js → spawn binary, timeout, output capture
└── tempFileManager.js → create/cleanup temp files
```

### Socket Integration
```
server/sockets/handlers/executionSocket.js
  → handles execute_code event
  → broadcasts execution:output to room

server/sockets/utils/socketEvents.js
  → EXECUTE_CODE, EXECUTION_OUTPUT, EXECUTION_ERROR
```

### Frontend Hooks & Components
```
client/src/hooks/useCodeExecution.js
  → manages execution lifecycle
  → emits/subscribes to socket events

client/src/components/room/
├── OutputPanel.jsx   → terminal-style output display
├── EditorPanel.jsx   → Run button added
└── RoomPage.jsx      → integrates execution

client/src/store/useSocketStore.js
  → emit() method exposed
  → socketClient getter
```

---

## SOCKET EVENTS (NEW)

| Direction | Event | Payload |
|-----------|-------|---------|
| C→S | `execute_code` | `{ roomId, code }` |
| S→C | `execution:output` | `{ roomId, result, executedBy, timestamp }` |

---

## TESTING QUICK START

1. **Terminal 1:** `cd server && npm run dev`
2. **Terminal 2:** `cd client && npm run dev`
3. **Browser 1:** Sign up, create room
4. **Browser 2 (incognito):** Sign up, join room
5. **Either user:** Click "Run" button
6. **Both see:** Output, errors, timing

---

## EXECUTION RESULT SHAPE

```javascript
{
  stdout: string,           // Program output
  stderr: string,           // Compile/runtime errors
  compileSuccess: boolean,  // Compile passed?
  runtimeSuccess: boolean,  // Execution passed?
  executionTime: number,    // Runtime ms
  compileTime: number,      // Compile ms
  timedOut: boolean         // Timeout occurred?
}
```

---

## DEPLOYMENT CHECKLIST

- [ ] g++ installed on server (`which g++`)
- [ ] `/tmp` directory writable (or `os.tmpdir()` equivalent)
- [ ] Node v18+ (built-ins available)
- [ ] Socket.IO running on same port as Express
- [ ] All routes registered in `/api/code`
- [ ] Socket handlers registered in connectionHandler.js

---

## COMMON COMMANDS

**Test simple compilation:**
```bash
echo '#include <iostream>
int main() { std::cout << "Hi" << std::endl; return 0; }' > test.cpp
g++ -o test test.cpp && ./test
```

**Check g++ version (need C++17):**
```bash
g++ --version  # Should be 7.0+
```

**Verify temp directory:**
```bash
node -e "console.log(require('os').tmpdir())"
```

---

## ARCHITECTURE DECISIONS

| Decision | Rationale |
|----------|-----------|
| Modular services | Separate concerns (compile, execute, cleanup) |
| Socket-based | Real-time broadcast to all users (not REST) |
| Spawn (not exec) | Prevents shell injection attacks |
| Force cleanup | Memory safety, no orphan files |
| 10MB output cap | Prevent memory overflow, keep UI responsive |
| Broadcast to room | All participants see same results |

---

## LIMITATIONS (BY DESIGN)

- No interactive input (cin not supported)
- No file I/O beyond process memory
- No external libraries (standard C++ only)
- No network access from code
- Single-server only (no Redis adapter)
- Execution history not persisted

**These are planned for Phase 7+**

---

## SECURITY MODEL

✅ **Process Isolation** — Each execution in unique temp directory
✅ **Timeout Protection** — 30s max runtime, 10s max compile
✅ **Resource Limits** — Output capped at 10MB
✅ **No Shell Access** — spawn() with array args, no string shell commands
✅ **Cleanup Guarantee** — finally block always runs
✅ **Room Validation** — Only room members can execute code

---

## NEXT PHASE (7)

**Realtime Chat** — Build on same socket patterns
- New event: `chat_message`
- New handler: `chatSocket.js`
- New state store: `useRoomChat`
- UI: Replace ChatPanel with message list

---

## DEBUGGING TIPS

**See logs:**
```bash
# Terminal with server running
npm run dev  # logs include [CodeExecution] prefix
```

**Check compilation:**
```bash
# Manually compile test code
g++ -o /tmp/test /tmp/test.cpp -std=c++17 2>&1
echo $?  # 0 = success
```

**Verify socket connectivity:**
```javascript
// In browser console
socketClient = useSocketStore.getState().socketClient
socketClient.connected  // true/false
socketClient.id         // socket ID
```

---

**Implementation complete. All files in place. Ready to test or move to Phase 7.**
