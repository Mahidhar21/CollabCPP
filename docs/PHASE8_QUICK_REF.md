## Phase 8: Presence & Participants — Quick Reference
**Last Updated:** May 24, 2026

---

## 📋 Files Created/Updated

### Created (3 files)
```
✅ server/sockets/utils/participantManager.js
✅ server/sockets/handlers/presenceSocket.js
✅ client/src/hooks/usePresence.js
```

### Updated (6 files)
```
✅ server/sockets/utils/socketEvents.js
✅ server/sockets/handlers/connectionHandler.js
✅ client/src/components/room/ParticipantsPanel.jsx
✅ client/src/pages/RoomPage.jsx
✅ client/src/sockets/socketEvents.js
```

---

## 🎯 What It Does

**On User Join:**
1. Server adds to participantStore + participantManager
2. Emits PARTICIPANT_JOINED to others in room
3. Emits PARTICIPANTS_SYNC to all (full list)
4. Frontend usePresence hook receives → updates state
5. ParticipantsPanel re-renders with new user

**On User Leave/Disconnect:**
1. Server removes from stores
2. Emits PARTICIPANT_LEFT to room
3. usePresence hook receives → removes participant
4. ParticipantsPanel updates instantly

---

## 🔌 Socket Events

### New Events
```javascript
// Client → Server
'participants_sync_request'     // Query on join
'get_presence_status'           // Query current

// Server → Client (already existed, now integrated)
'room:participant_joined'       // Someone joined
'room:participant_left'         // Someone left
'room:participants_sync'        // Full sync
```

---

## 💾 Backend API

### participantManager.js

```javascript
import {
  addParticipantAndBroadcast,      // Add + get all
  removeParticipantAndBroadcast,   // Remove + get remaining
  getRoomParticipantsForSync,      // Sanitized list
  isSocketInRoom,                  // Check membership
  getRoomParticipantCount,         // Count
  verifyRoomMembership             // Validate
} from './server/sockets/utils/participantManager.js'
```

---

## 🎯 Frontend API

### usePresence Hook

```javascript
import { usePresence } from './client/src/hooks/usePresence.js'

const {
  participants,              // Array
  loading,                  // Bool
  error,                    // String | null
  count,                    // Number
  getParticipantCount,      // () => number
  isParticipantOnline,      // (userId) => bool
  getParticipantByUserId,   // (userId) => participant | null
} = usePresence(roomId, isActive)
```

### ParticipantsPanel Component

```javascript
import ParticipantsPanel from './client/src/components/room/ParticipantsPanel.jsx'

<ParticipantsPanel
  participants={participants}    // Array
  isLoading={isLoading}          // Bool
  error={error}                  // String | null
/>
```

---

## 📊 Data Structure

### Participant Object
```javascript
{
  socketId: 'socket-abc123',
  userId: 'user-123',
  username: 'john_doe',
  roomId: 'CPP-XXXXX',
  joinedAt: '2026-05-24T13:52:41.285Z'
}
```

---

## 🧪 Quick Testing

### Test: Single User
```
1. Open room in Browser A
2. Check ParticipantsPanel → "1 online" ✓
3. Shows "YOU" badge ✓
```

### Test: Two Users
```
1. Browser A: User A joins
2. Browser B: User B joins (different account)
3. Browser A: Shows "2 online" with User B ✓
4. Browser B: Shows "2 online" with User A ✓
```

### Test: User Leaves
```
1. Both users in room
2. Browser B: Close/navigate away
3. Browser A: Immediately updates to "1 online" ✓
4. No page refresh needed ✓
```

### Test: Reconnect
```
1. Browser A: Offline (DevTools Network)
2. Browser B: Join room
3. Browser A: Reconnect internet
4. Browser A: Shows both users, no duplicates ✓
```

---

## ⚠️ Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Participants not showing | usePresence isActive=false | Ensure room is joined |
| Stale participant | Disconnect not handled | Check socket cleanup |
| "YOU" wrong user | Auth mismatch | Check useAuthStore.user.id |
| Duplicate entries | Multiple events fired | Check event deduplication |

---

## 🔒 Authorization

All queries verify room membership:
```javascript
const room = getParticipantRoom(socketId);
if (room !== requestedRoomId) {
  return callback({ error: 'Not in room' });
}
```

---

## 📈 Scalability

- **Memory:** ~150 bytes per participant
- **10 participants:** ~1.5 KB per room
- **100 participants:** ~15 KB per room
- **Future:** Redis integration for horizontal scaling

---

## 🚦 Integration Checklist

- [x] Backend participantManager implemented
- [x] Backend presenceSocket handlers implemented
- [x] Backend socket events registered
- [x] Frontend usePresence hook created
- [x] Frontend ParticipantsPanel updated
- [x] Frontend RoomPage integrated
- [x] Socket events synced (server ↔ client)
- [x] Manual testing completed

---

## 📝 Next Phase Ideas

- **Phase 9:** Cursor tracking per participant
- **Phase 10:** Activity indicators (typing, running code)
- **Phase 11:** Presence expiry / heartbeat system
- **Phase 12:** User status (away, idle, active)

---

## 🔗 Related Docs

- [PHASE8_PRESENCE.md](./PHASE8_PRESENCE.md) — Full documentation
- [MASTER_CONTEXT.md](./MASTER_CONTEXT.md) — Architecture overview
- [PHASE7_CHAT.md](./PHASE7_CHAT.md) — Chat system
