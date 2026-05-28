## Testing Session Persistence

Complete testing guide for Phase 10 session persistence features.

---

## Quick Start Testing

### 1. Single-User Session Persistence

**Test:** Code and chat persist when rejoining a room

```
Steps:
1. Start server: cd server && npm run dev
2. Start frontend: cd client && npm run dev
3. Go to dashboard, create room "TestRoom"
4. Type code: int main() { return 0; }
5. Send chat message: "Hello"
6. Leave room
7. Rejoin room (should restore code and chat)

Verify:
✓ Code restored exactly
✓ Chat message appears
✓ Save indicator showed briefly
```

### 2. Recent Sessions Dashboard

**Test:** Recent sessions appear on dashboard

```
Steps:
1. Create 3 rooms
2. Add activity (code, chat, drawings) to each
3. Return to dashboard
4. Scroll to "Recent sessions" section

Verify:
✓ Sessions appear in list
✓ Last active time shows correctly
✓ "Join" button works
✓ Participant count shows
```

### 3. Debouncing Effectiveness

**Test:** Rapid edits don't create excessive DB writes

```
Steps:
1. Open server logs: tail -f server.log
2. Join a room
3. Type rapidly: "Lorem ipsum dolor sit amet"
4. Watch server logs for "debounce save executed"

Verify:
✓ Only 1-2 save messages appear (not 26 for each letter)
✓ Timing: saves at ~5 second intervals
✓ Code persists on server after save
```

---

## Detailed Backend Tests

### Test Suite 1: Session Model

```
Test: Session schema validation
─────────────────────────────────
1. Create Session with required fields
2. Missing roomId should fail
3. Missing title should fail
4. Missing owner should fail
5. Arrays should accept proper structure
6. Timestamps auto-populate

Expected: ✓ All validations pass
```

### Test Suite 2: Session Service Functions

```
Test: saveSession() creates/updates
─────────────────────────────────────
1. Call saveSession() with new roomId
   → Session created with upsert
2. Call saveSession() with existing roomId
   → Session updated, not duplicated
3. Verify lastActive timestamp updated
4. Verify all fields saved correctly

Expected: ✓ Create on first call, update on subsequent
```

```
Test: loadSession() retrieves data
──────────────────────────────────
1. Create and save a session
2. loadSession(roomId)
3. Verify all fields returned
4. Call with non-existent roomId
   → Returns null gracefully
5. Verify references populated (owner, participants)

Expected: ✓ Correct data returned, null for missing
```

```
Test: getRecentSessions() pagination
──────────────────────────────────────
1. Create 25 sessions
2. Call getRecentSessions(userId, 10)
3. Should return 10 most recent
4. Should be sorted by lastActive DESC
5. Call with limit=100, should cap at 100

Expected: ✓ Proper pagination and sorting
```

```
Test: updateSessionCode() minimal write
────────────────────────────────────────
1. Create session with code="old"
2. Call updateSessionCode(roomId, "new")
3. Verify only code and lastActive updated
4. Verify other fields unchanged

Expected: ✓ Efficient minimal update
```

```
Test: addSessionMessage() with limit
──────────────────────────────────────
1. Add 1000 messages to session
2. Add one more message
3. Should maintain 1000 message limit
4. Oldest message removed

Expected: ✓ Array capped at 1000 messages
```

```
Test: addWhiteboardAction() with limit
───────────────────────────────────────
1. Add 10000 drawing actions
2. Add one more action
3. Should maintain 10000 action limit
4. Oldest action removed

Expected: ✓ Array capped at 10000 actions
```

### Test Suite 3: API Endpoints

```
Test: GET /api/sessions/:roomId
────────────────────────────────
1. Create and save session
2. Make GET request
3. Should return full session data
4. Request with non-existent roomId
   → Returns null gracefully
5. Request without auth token
   → Returns 401

Expected: ✓ Proper authorization and data
```

```
Test: POST /api/sessions/save
──────────────────────────────
1. POST with complete session data
2. Should create/update session
3. Response should include savedAt timestamp
4. POST with missing roomId
   → Returns 400 error
5. POST with missing title
   → Returns 400 error

Expected: ✓ Validation and proper response
```

```
Test: GET /api/sessions/recent
───────────────────────────────
1. Create 15 sessions for user
2. GET /api/sessions/recent
3. Should return 10 most recent (default limit)
4. GET /api/sessions/recent?limit=5
   → Returns 5 sessions
5. GET /api/sessions/recent?limit=500
   → Capped at 100

Expected: ✓ Pagination and limit enforcement
```

```
Test: DELETE /api/sessions/:roomId
───────────────────────────────────
1. Create session
2. DELETE as owner
   → Session deleted
3. Verify MongoDB document gone
4. DELETE non-existent session
   → Returns 404
5. DELETE as non-owner
   → Returns 403

Expected: ✓ Authorization and cascading delete
```

### Test Suite 4: Debouncing Logic

```
Test: Code debounce timer
──────────────────────────
1. Send SESSION_CODE_CHANGE event
2. Verify timer started (5 second timeout)
3. Send another SESSION_CODE_CHANGE immediately
4. Timer should reset
5. After 5 seconds, updateSessionCode() called
6. Timer cleared from map

Expected: ✓ Timer resets properly, saves after delay
```

```
Test: Chat debounce timer
──────────────────────────
1. Send SESSION_MESSAGE_ADD event
2. Timer starts (10 second timeout)
3. Send 2 more messages rapidly
4. Timer resets twice
5. After 10s, single addSessionMessage() call
6. All 3 messages saved in one batch

Expected: ✓ Messages batched into single write
```

```
Test: Whiteboard debounce timer
────────────────────────────────
1. Send 10 SESSION_WHITEBOARD_ACTION events
2. Timer starts (10 second timeout)
3. Events arrive 100ms apart
4. Timer resets each time
5. After 10s, addWhiteboardAction() called once
6. Events processed as batch

Expected: ✓ Drawing actions batched efficiently
```

```
Test: clearSessionDebounceTimers() on disconnect
──────────────────────────────────────────────────
1. User edits code (timer starts)
2. Simulate disconnect before timer fires
3. clearSessionDebounceTimers() called
4. All maps checked for this roomId
5. Timers cleared if present

Expected: ✓ No orphaned timers after disconnect
```

---

## Frontend Tests

### Test Suite 5: useSession Hook

```
Test: Load session on mount
─────────────────────────────
1. Mount useSession(roomId, true)
2. Should call GET /api/sessions/:roomId
3. If session exists:
   → setSessionData() called
   → sessionData.currentCode populated
4. If session doesn't exist:
   → sessionData remains null
   → No error shown

Expected: ✓ Session loaded and state set
```

```
Test: persistCode() emits event
─────────────────────────────────
1. Call persistCode("int main() {}")
2. Should emit SESSION_CODE_CHANGE event
3. Event includes roomId and code
4. Multiple calls don't cause errors
5. Works with empty code string

Expected: ✓ Socket event emitted correctly
```

```
Test: persistChatMessage() emits event
───────────────────────────────────────
1. Call persistChatMessage(
   msg, senderId, senderName)
2. Should emit SESSION_MESSAGE_ADD event
3. Event includes roomId and message object
4. Message has senderId, senderName, content, timestamp

Expected: ✓ Message event emitted with data
```

```
Test: persistWhiteboardAction() emits event
────────────────────────────────────────────
1. Call persistWhiteboardAction({
   type: 'DRAW',
   x: 10, y: 20, x0: 0, y0: 0,
   size: 2})
2. Should emit SESSION_WHITEBOARD_ACTION
3. Event includes roomId and action
4. All coordinates preserved

Expected: ✓ Drawing event emitted correctly
```

```
Test: saveSession() makes API call
───────────────────────────────────
1. Call saveSession({...fullState})
2. setSaveStatus('saving')
3. Should POST /api/sessions/save
4. Response success:
   → setSaveStatus('saved')
   → Auto-resets to 'idle' after 3s
5. Response error:
   → setSaveStatus('error')
   → Auto-resets after 5s

Expected: ✓ API call and state management correct
```

```
Test: useRecentSessions() hook
───────────────────────────────
1. Mount useRecentSessions()
2. Should fetch /api/sessions/recent
3. State updates with sessions array
4. Returns loading/error states properly

Expected: ✓ Recent sessions fetched and stored
```

### Test Suite 6: SessionStatus Component

```
Test: Show "Saving..." state
──────────────────────────────
1. <SessionStatus status="saving" />
2. Spinner should render
3. "Saving..." text appears
4. Appears in bottom-right corner

Expected: ✓ UI renders correctly
```

```
Test: Show "Saved" state
─────────────────────────
1. <SessionStatus status="saved" />
2. Checkmark icon rendered
3. "Saved" text appears
4. Component auto-hides after 2.5s

Expected: ✓ Success state displays and auto-dismisses
```

```
Test: Show "Error" state
────────────────────────
1. <SessionStatus status="error" />
2. Error icon rendered
3. "Save failed" text appears
4. Component auto-hides after 5s

Expected: ✓ Error state displays and auto-dismisses
```

```
Test: Hide for idle state
──────────────────────────
1. <SessionStatus status="idle" />
2. Component should not render (returns null)
3. No visual elements appear

Expected: ✓ Hidden when no save activity
```

### Test Suite 7: RecentSessionsList Component

```
Test: Render session list
──────────────────────────
1. Pass sessions array to component
2. Should render one card per session
3. Each card shows:
   → Session title (as link)
   → Owner name
   → Last active time
   → Participant count
   → Join button

Expected: ✓ All elements render correctly
```

```
Test: Show loading state
─────────────────────────
1. <RecentSessionsList loading={true} />
2. Spinner appears
3. "Loading sessions..." text

Expected: ✓ Loading UI correct
```

```
Test: Show error state
──────────────────────
1. <RecentSessionsList error="Failed" />
2. Error message displayed
3. Red styling applied

Expected: ✓ Error UI correct
```

```
Test: Show empty state
──────────────────────
1. <RecentSessionsList sessions={[]} />
2. Message: "No recent sessions yet"
3. No crash on empty array

Expected: ✓ Empty state handled gracefully
```

---

## Integration Tests

### Test Suite 8: Full Workflow

```
Test: Complete Session Lifecycle
──────────────────────────────────
1. User A creates room "Interview"
2. User A writes code: "int x = 5;"
3. User B joins room
4. User B sees User A's code ✓
5. User B sends chat: "Hello"
6. User A receives chat ✓
7. User A draws on whiteboard
8. User B sees drawing ✓
9. User A leaves room
10. Session saved to DB ✓
11. User A goes to dashboard
12. "Interview" appears in recent sessions ✓
13. User A rejoins room
14. Code, chat, and drawing all restored ✓

Expected: ✓ Full workflow completes without errors
```

```
Test: Multi-User Concurrent Edits
───────────────────────────────────
1. User A and B in same room
2. User A types code rapidly
3. User B sends multiple chat messages
4. Both drawing on whiteboard
5. Wait 10 seconds
6. Reload both users' browsers
7. Verify all changes persisted
8. No conflicts or data loss

Expected: ✓ Concurrent activities all persisted
```

```
Test: Network Interruption Resilience
──────────────────────────────────────
1. User actively editing
2. Simulate network disconnect
3. Re-establish connection
4. Wait 5-10 seconds for pending saves
5. Check MongoDB for session updates

Expected: ✓ All pending changes saved despite interruption
```

```
Test: Session Across Multiple Rooms
─────────────────────────────────────
1. User creates 3 rooms
2. Adds content (code, chat) to each
3. Leaves all rooms
4. Check recent sessions on dashboard
5. All 3 rooms appear with activity

Expected: ✓ Multiple session states tracked independently
```

---

## Performance Tests

### Test Suite 9: Load & Scale

```
Test: 100 Concurrent Active Rooms
──────────────────────────────────
1. Simulate 100 users in separate rooms
2. Each user typing continuously
3. Monitor debounce timer count
4. Monitor MongoDB connection pool
5. Wait 60 seconds
6. Check memory usage on server

Verify:
✓ No memory leaks
✓ ~100 debounce timers per type
✓ Database queries execute within SLA
✓ CPU usage reasonable
```

```
Test: High Message Volume
──────────────────────────
1. Room with 10 users
2. Send 100 messages in 30 seconds
3. Monitor debounce batching
4. Measure time to persist all messages
5. Verify no message loss

Expected:
✓ Messages batched every 10 seconds
✓ Batches contain ~30 messages each
✓ Total DB writes: ~3 instead of 100
```

```
Test: Large Code Edits
──────────────────────
1. Paste 50KB of code
2. Modify multiple sections rapidly
3. Monitor debounce efficiency
4. Verify code saved completely

Expected:
✓ Large code persisted without truncation
✓ Single save after debounce (not split)
✓ Performance acceptable (< 100ms save time)
```

---

## Checklist

### Backend Deployment
- [ ] Session model compiles without errors
- [ ] Database indexes created
- [ ] All routes mounted in index.js
- [ ] Socket handlers registered in connectionHandler
- [ ] Error handlers catch persistence failures
- [ ] Logs show successful saves

### Frontend Deployment
- [ ] All hooks import correctly
- [ ] SessionStatus component renders
- [ ] RecentSessionsList displays data
- [ ] DashboardPage loads recent sessions
- [ ] RoomPage integrates persistence
- [ ] No console errors on page load

### Database
- [ ] MongoDB sessions collection created
- [ ] Indexes on roomId, owner, lastActive, isActive
- [ ] Sample session document validates schema
- [ ] Old data safely migrated if upgrading

### User Experience
- [ ] "Saving..." indicator appears briefly
- [ ] "Saved" checkmark confirms persistence
- [ ] Sessions restore on room rejoin
- [ ] Recent sessions list shows activity
- [ ] No noticeable performance degradation

---

## Debugging Commands

```bash
# Check MongoDB for sessions
mongo
> db.sessions.find().pretty()
> db.sessions.find({ roomId: 'CPP-ABC' })
> db.sessions.count()

# Monitor debounce timers in server logs
tail -f server.log | grep "debounce"

# Check server memory usage
ps aux | grep node
free -h

# Verify API responses
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/sessions/recent

# Check socket events in browser console
socket.on('session:code_change', (data) => {
  console.log('Session code changed:', data);
});
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Sessions not saving | MongoDB connection failed | Check `.env` MONGODB_URI, verify network access |
| Debounce timers not firing | clearSessionDebounceTimers not called | Add to disconnect handler in connectionHandler |
| Memory leak | Timers not cleared | Verify clearSessionDebounceTimers() called on disconnect |
| Slow API response | Too many old sessions | Add pagination limit or archive old sessions |
| Duplicate messages | Debounce not applied | Check SESSION_MESSAGE_ADD handler has debounce |
| UI not updating | Missing socket listener | Verify subscribe() called in useSession |

---
