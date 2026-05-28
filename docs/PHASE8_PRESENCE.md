## Phase 8: Presence & Participants System
### Realtime Collaborative Awareness

**Status:** ✅ Complete  
**Version:** 1.0  
**Date:** May 24, 2026

---

## 🎯 Overview

Phase 8 implements a robust realtime participants and presence system. Users can now:
- See active participants in a room
- View join/leave updates in realtime
- Experience synchronized room awareness
- Track participant status with online indicators

This system is foundational for collaborative awareness, cursor ownership, and multiplayer synchronization.

---

## 📊 Architecture

### Backend Structure

```
server/sockets/
├── utils/
│   ├── participantStore.js      (low-level state)
│   ├── participantManager.js    (enhanced manager)
│   └── socketEvents.js          (event definitions)
├── handlers/
│   ├── connectionHandler.js     (lifecycle)
│   ├── presenceSocket.js        (presence events)
│   └── roomSocket.js            (room lifecycle)
```

### Frontend Structure

```
client/src/
├── hooks/
│   └── usePresence.js           (state management)
├── components/room/
│   └── ParticipantsPanel.jsx    (UI display)
├── pages/
│   └── RoomPage.jsx             (integration)
└── sockets/
    └── socketEvents.js          (event definitions)
```

---

## 🔌 Socket Events Flow

### Client → Server Events

```javascript
// Request current presence status
{
  event: 'get_presence_status',
  data: { roomId },
  callback: (response) => { success, participants, count }
}

// Request participant sync (on join)
{
  event: 'participants_sync_request',
  data: { roomId },
  callback: (response) => { success, participants }
}
```

### Server → Client Events

```javascript
// Broadcast when someone joins
{
  event: 'room:participant_joined',
  data: { roomId, participant: { socketId, userId, username, joinedAt } }
}

// Broadcast when someone leaves
{
  event: 'room:participant_left',
  data: { roomId, participant: { socketId, userId, username } }
}

// Full participant sync after join/leave
{
  event: 'room:participants_sync',
  data: { roomId, participants: [], count }
}
```

---

## 📁 Files Explanation

### Backend

#### `server/sockets/utils/participantManager.js` (NEW)
**Purpose:** Enhanced participant management utilities  
**Key Functions:**
- `addParticipantAndBroadcast(participant)` - Add and get all room participants
- `removeParticipantAndBroadcast(socketId)` - Remove and return remaining participants
- `getRoomParticipantsForSync(roomId)` - Sanitized participant list for broadcast
- `isSocketInRoom(socketId, roomId)` - Verify room membership
- `getRoomParticipantCount(roomId)` - Get participant count
- `verifyRoomMembership(socketId, roomId)` - Validate before action

**Exports:** Named exports for modular usage

#### `server/sockets/handlers/presenceSocket.js` (NEW)
**Purpose:** Presence event handlers  
**Events Handled:**
1. `PARTICIPANTS_SYNC_REQUEST` - Return current participants
2. `GET_PRESENCE_STATUS` - Query presence state

**Behavior:**
- Validates room membership before returning data
- Prevents unauthorized access
- Logs all operations for debugging

#### `server/sockets/utils/socketEvents.js` (UPDATED)
**Changes:**
- Added `PARTICIPANTS_SYNC_REQUEST: 'participants_sync_request'`
- Added `GET_PRESENCE_STATUS: 'get_presence_status'`

#### `server/sockets/handlers/connectionHandler.js` (UPDATED)
**Changes:**
- Imported `registerPresenceSocketHandlers`
- Registered presence handlers on socket connect

---

### Frontend

#### `client/src/hooks/usePresence.js` (NEW)
**Purpose:** Presence state management hook  
**API:**
```javascript
const {
  participants,        // Array of current participants
  loading,            // Bool: loading participant list
  error,              // String: error message or null
  count,              // Number: participant count
  getParticipantCount,// Fn: () => count
  isParticipantOnline,// Fn: (userId) => bool
  getParticipantByUserId, // Fn: (userId) => participant | null
} = usePresence(roomId, isActive)
```

**Behavior:**
- Loads participant list on room join
- Subscribes to PARTICIPANTS_SYNC updates
- Listens for PARTICIPANT_JOINED events
- Listens for PARTICIPANT_LEFT events
- Returns utility functions for queries
- Auto-cleanup on unmount

#### `client/src/components/room/ParticipantsPanel.jsx` (UPDATED)
**Props:**
```javascript
{
  participants,   // Array of participants
  isLoading,     // Bool: loading state
  error          // String | null
}
```

**Features:**
- Sorts current user first, then by join time
- Shows online indicator (pulsing dot)
- Displays username + "YOU" badge for current user
- Shows join timestamp ("just now", "5m ago", etc.)
- Polished dark theme styling
- Smooth transitions and hover states
- Responsive participant count badge

**UI Elements:**
- Online status indicator (green pulsing dot)
- User activity indicator (accent dot for others)
- "YOU" badge for current user
- Relative time display (joined 2m ago)
- Loading and error states
- Empty state when no participants

#### `client/src/pages/RoomPage.jsx` (UPDATED)
**Changes:**
- Imported `usePresence` hook
- Added `usePresence` hook call
- Passed `participants`, `presenceLoading`, `presenceError` to ParticipantsPanel
- Integrated chat in sidebar (not duplicated in main)

---

## 🔄 Participant Lifecycle

### Join Flow

```
1. User clicks "Join Room"
   ↓
2. RoomPage mounts, useRoomSocket initiates join
   ↓
3. Server receives join_room event
   ↓
4. Server adds participant via addParticipant()
   ↓
5. Server emits PARTICIPANT_JOINED to others
   ↓
6. Server emits PARTICIPANTS_SYNC to all in room
   ↓
7. usePresence hook receives sync → updates state
   ↓
8. ParticipantsPanel re-renders with new participants
```

### Leave Flow

```
1. User navigates away / closes tab
   ↓
2. Socket disconnect event fires
   ↓
3. connectionHandler.js calls removeParticipant()
   ↓
4. Server emits PARTICIPANT_LEFT to room
   ↓
5. usePresence hook receives event → removes participant
   ↓
6. ParticipantsPanel re-renders
```

### Reconnect Flow

```
1. User reconnects (network restore, tab refocus, etc.)
   ↓
2. Socket.IO auto-reconnect triggers
   ↓
3. New socket ID assigned
   ↓
4. join_room handler runs
   ↓
5. Server adds participant with new socket ID
   ↓
6. PARTICIPANT_JOINED emitted
   ↓
7. User appears in list with "just now" timestamp
```

---

## 🎨 UI/UX Details

### ParticipantsPanel Design

**Light Theme (Dark Mode Only):**
- Background: `surface-overlay` (slightly lighter)
- Text: `foreground` for names, `accent-dim` for timestamps
- Indicators: `green-400`/`green-500` for online status
- Hover: `surface-border/30` opacity shift
- Badge: `accent` color for count

**Layout:**
```
┌─ Participants ─────────────┐
│ 3 online                   │
├────────────────────────────┤
│ ✓ Current User    YOU      │  ← Highlighted
│   just now                 │
│ ✓ Collaborator 1           │  ← Activity dot
│   2m ago                   │
│ ✓ Collaborator 2           │
│   5m ago                   │
└────────────────────────────┘
```

**States:**
1. **Loading:** "Loading participants…" centered message
2. **Error:** Red error text centered
3. **Empty:** "No participants" message
4. **Populated:** Sorted list with indicators

---

## 🧪 Testing Guide

### Manual Testing

**Test 1: Single User Join**
1. Open room in one browser tab (User A)
2. Wait 1-2 seconds
3. ✅ ParticipantsPanel shows "1 online"
4. ✅ Shows User A with "YOU" badge
5. ✅ "just now" timestamp displays

**Test 2: Two Users Join**
1. Open room in Tab 1 (User A)
2. Open room in Tab 2 (User B - different user account)
3. ✅ Tab 1 shows "2 online": User A (YOU), User B
4. ✅ Tab 2 shows "2 online": User B (YOU), User A
5. ✅ Both show correct timestamps

**Test 3: Join Notification**
1. User A in room, viewing participants
2. User B joins room
3. ✅ Tab A immediately updates: count increases to 2
4. ✅ Tab A shows User B in list with "just now"
5. ✅ No page refresh needed

**Test 4: Leave Notification**
1. Both users in room
2. User B closes tab / navigates away
3. ✅ Tab A immediately updates: count drops to 1
4. ✅ Tab A participant list removes User B
5. ✅ Smooth transition (no flicker)

**Test 5: Reconnect**
1. User A in room
2. User B joins
3. User B disconnects internet (DevTools Network offline)
4. User B reconnects internet
5. ✅ User B socket updates
6. ✅ Tab A shows User B still present (no duplicate entries)
7. ✅ Timestamp updates appropriately

**Test 6: Current User Highlight**
1. Open room in Tab 1 (User A)
2. Open room in Tab 2 (User B)
3. ✅ Tab 1: User A has darker background + "YOU" badge
4. ✅ Tab 2: User B has darker background + "YOU" badge
5. ✅ Current user always appears first in list

**Test 7: Timestamp Accuracy**
1. User A joins at time T0
2. Wait 5 minutes
3. User B joins at time T5
4. ✅ User A shows "5m ago"
5. ✅ User B shows "just now"
6. ✅ Timestamps update in realtime

**Test 8: Multiple Rapid Joins**
1. User A in room
2. Quickly open room in 3 additional tabs (Users B, C, D)
3. ✅ Count updates: 1 → 2 → 3 → 4 (rapid succession)
4. ✅ No duplicate entries
5. ✅ All participants listed correctly

**Test 9: No Stale State**
1. User A in room viewing participants (2 online)
2. User B leaves undetected (no disconnect event)
3. User C joins
4. User A performs action (type, run code, etc.)
5. ✅ Participants list syncs with actual state
6. ✅ Stale B entry not present

**Test 10: Error Handling**
1. Set up room with intentional error (e.g., invalid roomId)
2. ✅ usePresence returns error
3. ✅ ParticipantsPanel displays error message
4. ✅ User can still interact with room

---

## 🔐 Security Considerations

### Authorization Checks

All presence endpoints verify room membership:
```javascript
// presenceSocket.js
const currentRoom = getParticipantRoom(socket.id);
if (currentRoom !== roomId) {
  return callback({ success: false, error: 'Not in room' });
}
```

### Data Sanitization

Participants broadcast with only safe fields:
```javascript
// Only these fields exposed:
- socketId: for identification
- userId: for user attribution
- username: for display
- joinedAt: for timestamp
```

No sensitive data (IPs, tokens, etc.) exposed.

---

## 🚀 Performance Notes

### Memory Usage

**Per Participant:**
- socketId: ~36 bytes
- userId: ~24 bytes
- username: ~20-50 bytes
- joinedAt: ~24 bytes
- **Total per participant: ~100-150 bytes**

**Per Room:**
- 10 participants: ~1.5 KB
- 100 participants: ~15 KB
- **Scales well for typical use**

### Event Frequency

- **PARTICIPANT_JOINED:** Once per join (~1-5 times/minute per room)
- **PARTICIPANT_LEFT:** Once per leave (~1-5 times/minute per room)
- **PARTICIPANTS_SYNC:** Once after join, broadcasts to entire room
- **GET_PRESENCE_STATUS:** On-demand query, minimal overhead

### Optimization Strategies

1. **Batch updates:** Multiple joins/leaves might batch sync
2. **Redis Ready:** For scaling, replace in-memory store with Redis
3. **Presence TTL:** Optional: auto-remove participants after inactivity

---

## 🐛 Debugging

### Enable Logging

All operations logged to console:
```
Socket connected { socketId, userId, username }
Participant sync requested { roomId, count }
Participant added { socketId, roomId }
Participant removed { socketId, roomId }
```

### Common Issues

**Issue: Participants not showing**
- Check: usePresence isActive prop = true
- Check: Room membership verified
- Check: Socket events received in DevTools

**Issue: Stale participants in list**
- Check: Disconnect handler properly removes
- Check: Socket events firing for left users
- Check: Check browser console for errors

**Issue: "You" badge wrong user**
- Check: useAuthStore.user.id matches participant.userId
- Check: User logged in correctly

---

## 📚 Related Phases

- **Phase 4:** Collaborative editor (uses participant list for cursors)
- **Phase 5:** Real-time synchronization (foundation)
- **Phase 7:** Chat system (shows sender info from participants)
- **Phase 9:** Future cursor/awareness features will build on this

---

## ✅ Checklist

- [x] Backend: participantManager.js created
- [x] Backend: presenceSocket.js handlers created
- [x] Backend: Socket events registered
- [x] Frontend: usePresence hook created
- [x] Frontend: ParticipantsPanel updated with full UI
- [x] Frontend: RoomPage integrated presence
- [x] Testing: Manual test guide created
- [x] Documentation: Complete

---

## 🔄 Future Enhancements

1. **Activity Status:** Show what user is doing (typing, running code, etc.)
2. **Cursor Tracking:** Show remote cursor positions per participant
3. **Presence Indicators:** Show if user is "away", "idle", etc.
4. **Notification Sounds:** Optional join/leave sounds
5. **Participant Actions:** Click to focus on participant's cursor, etc.
6. **Presence Persistence:** Cache recent participants locally
