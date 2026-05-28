/**
 * Centralized Socket.IO event names.
 */
export const SOCKET_EVENTS = {
  // Client → Server — room lifecycle
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',

  // Client → Server — collaborative editor
  CODE_CHANGE: 'code_change',
  CURSOR_MOVE: 'cursor_move',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Client → Server — code execution
  EXECUTE_CODE: 'execute_code',

  // Client → Server — chat
  SEND_MESSAGE: 'send_message',
  GET_CHAT_HISTORY: 'get_chat_history',

  // Server → Client — room presence
  PARTICIPANTS_SYNC: 'room:participants_sync',
  PARTICIPANT_JOINED: 'room:participant_joined',
  PARTICIPANT_LEFT: 'room:participant_left',
  CONNECTION_ACK: 'connection_ack',
  ROOM_ERROR: 'room:error',

  // Server → Client — collaborative editor
  EDITOR_CODE_SYNC: 'editor:code_sync',
  EDITOR_CODE_CHANGE: 'editor:code_change',
  EDITOR_CURSOR_MOVE: 'editor:cursor_move',
  EDITOR_CURSOR_REMOVE: 'editor:cursor_remove',
  EDITOR_TYPING_UPDATE: 'editor:typing_update',

  // Server → Client — code execution
  EXECUTION_OUTPUT: 'execution:output',
  EXECUTION_ERROR: 'execution:error',

  // Server → Client — chat
  RECEIVE_MESSAGE: 'receive_message',

  // Client → Server — presence
  PARTICIPANTS_SYNC_REQUEST: 'participants_sync_request',
  GET_PRESENCE_STATUS: 'get_presence_status',

  // Client → Server — whiteboard
  DRAW: 'draw',
  ERASE: 'erase',
  CLEAR_CANVAS: 'clear_canvas',

  // Client → Server — session persistence
  SESSION_CODE_CHANGE: 'session:code_change',
  SESSION_MESSAGE_ADD: 'session:message_add',
  SESSION_WHITEBOARD_ACTION: 'session:whiteboard_action',
  SESSION_SAVE_REQUEST: 'session:save_request',

  // Server → Client — session events
  SESSION_LOAD: 'session:load',
  SESSION_SAVED: 'session:saved',
  SESSION_SAVE_FAILED: 'session:save_failed',
};
