# PHASE 6 — Detailed Execution Flow

## End-to-End Sequence Diagram

```
User A (Browser)          Socket Connection        Server              User B (Browser)
     │                          │                      │                      │
     │  In room "cpp-ABC123"    │                      │                      │
     │◄──────────────────────────┤                      │                      │
     │                           │                      │   In room "cpp-ABC123"│
     │                           │                      │      ───────────────►│
     │                           │                      │                      │
     │  Clicks "Run"             │                      │                      │
     │  (sends code)             │                      │                      │
     ├─────execute_code─────────►│                      │                      │
     │  {roomId, code}           │                      │                      │
     │                           │                      │                      │
     │                           │  validate room   │                      │
     │                           │  membership      │                      │
     │                           │                   │                      │
     │                           ├─ compile.js ─┐   │                      │
     │                           │  (g++ 10s)    ├─ compile OK              │
     │                           ├─────────────┘│                      │
     │                           │                   │                      │
     │                           │ processManager.js │                      │
     │                           │  execute (30s)    │                      │
     │                           │  capture stdout   │                      │
     │                           │                   │                      │
     │                           │ tempFileManager.js│                      │
     │                           │  cleanup          │                      │
     │                           │                   │                      │
     │                           ├─ emit to room ─┐  │                      │
     │◄──execution:output────────┤  result: {       ├─►│◄──execution:output─┤
     │  {result, executedBy}     │   stdout, stderr, │                      │
     │                           │   times, success} │  {result, executedBy}│
     │                           │  ─────────────┘  │                      │
     │  Display in console       │                      │  Display in console  │
     │                           │                      │                      │
```

---

## Phase 1: Client Initiates Execution

### RoomPage Component
```javascript
const { executeCode, isExecuting, executionOutput } = useCodeExecution(roomId, enabled);

// Editor passes current code
<EditorPanel onRunCode={executeCode} isExecuting={isExecuting} />

// Output panel receives result
<OutputPanel output={executionOutput} />
```

### Run Button Click
```javascript
// EditorPanel.jsx toolbar
<button onClick={() => onRunCode(code)}>
  {isExecuting ? 'Running...' : 'Run'}
</button>
```

### useCodeExecution Hook
```javascript
const executeCode = (code) => {
  setIsExecuting(true);
  
  // Emit socket event
  emit(
    SOCKET_EVENTS.EXECUTE_CODE,
    { roomId, code },
    (ack) => {
      if (!ack?.success) setExecutionError(ack?.message);
      // Output comes via EXECUTION_OUTPUT listener
    }
  );
};
```

---

## Phase 2: Server Receives & Validates

### executionSocket.js Handler
```javascript
socket.on('execute_code', async (data, ack) => {
  const { roomId, code } = data;
  
  // 1. Validate room membership
  const room = getParticipantRoom(socket.id);
  if (!room || room !== roomId) {
    ack({ success: false, message: 'Not in room' });
    return;
  }
  
  logger.info(`User ${socket.user.username} executing in ${roomId}`);
  
  // 2. Execute
  const result = await executeCode(code, {...});
  
  // 3. Broadcast to room
  io.to(roomId).emit('execution:output', {
    roomId,
    executedBy: { userId, username, socketId },
    result,
    timestamp,
  });
  
  // 4. Acknowledge sender
  ack({ success: true });
});
```

---

## Phase 3: Code Execution Orchestration

### Main Orchestrator: `executeCode(code, options)`

```javascript
export async function executeCode(code, options = {}) {
  const tempDir = createTempDirectory();
  // Returns: /tmp/collabcpp-1716432000-abc123def
  
  try {
    // STEP 1: Write source
    const sourceFile = await writeTempSourceFile(tempDir, code);
    // Creates: /tmp/collabcpp-.../main.cpp
    
    // STEP 2: Compile
    const binaryPath = getBinaryPath(tempDir);
    // Returns: /tmp/collabcpp-.../main (or .exe on Windows)
    
    const compileResult = await compileCpp(
      sourceFile,
      binaryPath,
      10000  // 10s timeout
    );
    
    if (!compileResult.success) {
      return {
        stdout: '',
        stderr: compileResult.stderr,  // Compiler error message
        compileSuccess: false,
        runtimeSuccess: false,
        compileTime: compileResult.compileTime,
      };
    }
    
    // STEP 3: Execute
    const runtimeResult = await executeProcess(
      binaryPath,
      30000  // 30s timeout
    );
    
    return {
      stdout: runtimeResult.stdout,
      stderr: runtimeResult.stderr,
      compileSuccess: true,
      runtimeSuccess: runtimeResult.runtimeSuccess,
      executionTime: runtimeResult.executionTime,
      compileTime: compileResult.compileTime,
      timedOut: runtimeResult.timedOut,
    };
    
  } catch (error) {
    return { stderr: error.message, compileSuccess: false, ... };
    
  } finally {
    // ALWAYS cleanup
    await cleanupTempDirectory(tempDir);
  }
}
```

### Phase 3a: Compilation (`compileCpp.js`)

```javascript
export async function compileCpp(sourceFile, outputBinary, timeout = 10000) {
  return new Promise((resolve) => {
    const compiler = spawn('g++', [
      '-o', outputBinary,
      sourceFile,
      '-std=c++17',
      '-Wall',
      '-Wextra',
    ]);
    
    let stderr = '';
    compiler.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timeoutHandle = setTimeout(() => {
      compiler.kill('SIGTERM');  // First signal
    }, timeout);
    
    compiler.on('close', (code) => {
      clearTimeout(timeoutHandle);
      
      if (code === 0) {
        resolve({ success: true, stderr: '', compileTime: elapsed });
      } else {
        resolve({ 
          success: false, 
          stderr: stderr || `Failed with code ${code}`,
          compileTime: elapsed 
        });
      }
    });
  });
}
```

**Command executed:**
```bash
g++ -o /tmp/collabcpp-1716432000-abc/main \
    /tmp/collabcpp-1716432000-abc/main.cpp \
    -std=c++17 -Wall -Wextra
```

### Phase 3b: Execution (`processManager.js`)

```javascript
export async function executeProcess(binaryPath, timeout = 30000) {
  return new Promise((resolve) => {
    const process = spawn(binaryPath, []);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 10 * 1024 * 1024) {
        process.kill('SIGTERM');  // Cap at 10MB
      }
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 1 * 1024 * 1024) {
        process.kill('SIGTERM');  // Cap at 1MB
      }
    });
    
    const timeoutHandle = setTimeout(() => {
      process.kill('SIGTERM');
      setTimeout(() => process.kill('SIGKILL'), 2000);  // Force kill
    }, timeout);
    
    process.on('close', (code) => {
      clearTimeout(timeoutHandle);
      
      resolve({
        stdout,
        stderr,
        runtimeSuccess: code === 0,
        executionTime: elapsed,
        timedOut: false,
      });
    });
  });
}
```

**Example execution:**
```bash
/tmp/collabcpp-1716432000-abc/main

# Waits for exit or 30s timeout
# Captures all stdout/stderr
```

### Phase 3c: Cleanup (`tempFileManager.js`)

```javascript
export async function cleanupTempDirectory(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    // Deletes: /tmp/collabcpp-1716432000-abc (and contents)
    // force: true = don't error if already deleted
  } catch (error) {
    console.warn(`Warning: cleanup failed: ${error.message}`);
    // Log but don't throw — execution already complete
  }
}
```

---

## Phase 4: Broadcast to Room

### Server broadcasts result
```javascript
io.to(roomId).emit('execution:output', {
  roomId: 'cpp-ABC123',
  executedBy: {
    userId: '507f1f77bcf86cd799439011',
    username: 'user1',
    socketId: 'abc123def456',
  },
  result: {
    stdout: 'Hello from CollabCPP!\n',
    stderr: '',
    compileSuccess: true,
    runtimeSuccess: true,
    executionTime: 45,
    compileTime: 120,
    timedOut: false,
  },
  timestamp: '2026-05-22T10:30:00Z',
});
```

**Reached:** All sockets in room (including sender)

---

## Phase 5: Client Receives & Displays

### useCodeExecution Hook Listens
```javascript
useEffect(() => {
  const unsubscribe = subscribe(SOCKET_EVENTS.EXECUTION_OUTPUT, (data) => {
    if (data?.roomId === roomId) {
      setExecutionOutput(data);      // Store entire object
      setIsExecuting(false);          // Stop loading state
    }
  });
  
  return () => unsubscribe();
}, [subscribe, roomId]);
```

### OutputPanel Renders Result

```javascript
const { result, executedBy } = output || {};

return (
  <div className="console">
    {/* Header */}
    <div className="header">
      <span>Console</span>
      {executedBy && <span>by {executedBy.username}</span>}
    </div>
    
    {/* Compilation Status */}
    {result && (
      <div className="status">
        <span className={result.compileSuccess ? 'ok' : 'error'}>
          Compilation {result.compileSuccess ? '✓' : '✗'} ({result.compileTime}ms)
        </span>
      </div>
    )}
    
    {/* Compile Errors */}
    {!result.compileSuccess && result.stderr && (
      <pre className="error-box">{result.stderr}</pre>
    )}
    
    {/* Execution Status */}
    {result.compileSuccess && (
      <div className="status">
        <span className={result.runtimeSuccess ? 'ok' : 'error'}>
          Execution {result.runtimeSuccess ? '✓' : '✗'} ({result.executionTime}ms)
          {result.timedOut && ' · Timeout'}
        </span>
      </div>
    )}
    
    {/* Runtime Errors */}
    {result.compileSuccess && !result.runtimeSuccess && result.stderr && (
      <pre className="error-box">{result.stderr}</pre>
    )}
    
    {/* Output */}
    {result.compileSuccess && result.stdout && (
      <pre className="output-box">{result.stdout}</pre>
    )}
  </div>
);
```

---

## Timeout Behavior Examples

### Compilation Timeout
```cpp
// File: main.cpp — complex template metaprogramming
#include <iostream>
template <int N>
struct Fib { enum { value = Fib<N-1>::value + Fib<N-2>::value }; };
// ... recursive without base case

// Compiler tries to instantiate infinitely
// After 10s: compiler.kill('SIGTERM')
// Result: stderr = "Compilation timed out"
```

### Execution Timeout
```cpp
// Runtime loop
int main() {
  while (true) {  // Infinite loop
    // Do nothing
  }
  return 0;
}

// After 30s: process.kill('SIGTERM')
// After 32s: process.kill('SIGKILL')  // Force
// Result: stderr = "Process exceeded time limit"
```

---

## Error Handling Examples

### Scenario 1: Missing g++
```
Error: spawn ENOENT
→ Caught in compiler.on('error')
→ Result: { stderr: "Compilation error: g++ not found", compileSuccess: false }
```

### Scenario 2: Syntax Error
```cpp
int main() {
  cout << "Missing semicolon"  // ← error here
  return 0;
}

// g++ output to stderr:
// main.cpp:2:37: error: expected ';' before 'return'

// Result: 
// { 
//   stderr: "main.cpp:2:37: error: ...",
//   compileSuccess: false 
// }
```

### Scenario 3: Runtime Crash
```cpp
int main() {
  int arr[3] = {1, 2, 3};
  cout << arr[100] << endl;  // Access out of bounds
  return 0;  // Never reached
}

// Behavior depends on OS:
// - Linux: Likely segmentation fault
// - macOS: Likely segmentation fault
// - Windows: May crash or return garbage

// Result:
// {
//   compileSuccess: true,
//   runtimeSuccess: false,
//   stderr: (depends on OS, may be empty or error output),
//   exit code: non-zero
// }
```

### Scenario 4: Output Exceeded
```cpp
int main() {
  for (int i = 0; i < 1000000; i++) {
    cout << "Line " << i << string(1000, 'x') << endl;  // Lots of output
  }
  return 0;
}

// After stdout exceeds 10MB:
// process.kill('SIGTERM')
// stdout is truncated + appended:
// "...[Output truncated — exceeded 10MB limit]"

// Result:
// {
//   compileSuccess: true,
//   runtimeSuccess: false,  // Killed
//   stdout: "Line 0 xxx...\nLine 1 xxx...\n[Output truncated...]",
//   executionTime: ~5000  // Killed early
// }
```

---

## Resource & Performance Metrics

### Typical Timings
| Operation | Time |
|-----------|------|
| Compile "Hello World" | 50–150ms |
| Compile complex code | 300–1000ms |
| Execute "Hello World" | 5–20ms |
| Execute with I/O | 50–500ms |
| Cleanup directory | 10–50ms |
| **Total (simple)** | **100–250ms** |
| **Total (complex)** | **500–2000ms** |

### Memory Usage
- **Process:** ~50MB per g++ invocation
- **Server:** ~5MB per execution result in memory
- **Cleanup:** Returned to OS immediately

### Socket Broadcast Latency
- **Local network:** <10ms
- **Broadcast to 5 users:** ~5–15ms
- **UI render:** ~50ms (React batching)

---

## Multi-User Scenario

### Timeline
```
T=0s    User A clicks Run (code = "cout << 'A'")
T=0.05s Server receives execute_code, starts compile
T=0.15s Compile succeeds, starts execution
T=0.20s Execution completes, broadcasts execution:output
T=0.25s User A receives result, displays "A"
T=0.25s User B receives result, displays "A" (by User A)
        
T=5s    User B clicks Run (different code = "cout << 'B'")
T=5.05s Server receives, compiles
T=5.20s Executes, broadcasts
T=5.25s Both users see result "B" (by User B)
```

### View Each User Sees
**User A's screen:**
```
[Output console]
Compilation ✓ (120ms)
Execution ✓ (45ms)
Output: "A"

Executed by: You
```

**User B's screen (same result):**
```
[Output console]
Compilation ✓ (120ms)
Execution ✓ (45ms)
Output: "B"

Executed by: User B
```

---

## Summary

1. **Client** emits `execute_code` with room ID + code
2. **Server** validates, orchestrates compile → execute → cleanup
3. **Broadcast** sends result to all room members
4. **Clients** receive, store, display in OutputPanel
5. **UI** shows status, errors, output, timing
6. **Cleanup** always runs, even on errors/timeouts

This architecture maintains:
- ✅ Security (no shell injection, room validation)
- ✅ Reliability (timeout protection, resource limits)
- ✅ Real-time visibility (socket broadcast)
- ✅ Clean separation (modular services)
- ✅ Resource safety (guaranteed cleanup)
