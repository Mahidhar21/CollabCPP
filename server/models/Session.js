/**
 * Session Model
 * Persistent storage for collaborative session state
 * 
 * Stores:
 * - Room metadata (title, ownership, participants)
 * - Collaborative code state (latest code)
 * - Chat history (all messages with timestamps/senders)
 * - Whiteboard data (drawing actions/state)
 * - Activity tracking (creation, last active)
 */

import mongoose from 'mongoose';

const drawingActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['DRAW', 'ERASE', 'CLEAR'],
      required: true,
    },
    x: Number,
    y: Number,
    x0: Number,
    y0: Number,
    size: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: String,
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const participantHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: String,
    joinedAt: Date,
    lastActive: Date,
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    // Room identifiers
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    // Ownership and participants
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: [participantHistorySchema],

    // Collaborative state
    currentCode: {
      type: String,
      default: '',
      maxlength: 100000,
    },

    // Chat persistence
    chatHistory: {
      type: [chatMessageSchema],
      default: [],
      maxlength: 1000,
    },

    // Whiteboard persistence
    whiteboardData: {
      type: [drawingActionSchema],
      default: [],
      maxlength: 10000,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Session info
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
sessionSchema.index({ owner: 1, lastActive: -1 });
sessionSchema.index({ isActive: 1, lastActive: -1 });
sessionSchema.index({ 'participants.user': 1 });

export const Session = mongoose.model('Session', sessionSchema);
