import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Room title is required'],
      trim: true,
      maxlength: [80, 'Title cannot exceed 80 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: [participantSchema],
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ updatedAt: -1 });
roomSchema.index({ 'participants.user': 1 });

function toIdString(ref) {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (ref._id) return ref._id.toString();
  if (ref.id) return ref.id.toString();
  return ref.toString();
}

roomSchema.methods.hasParticipant = function hasParticipant(userId) {
  const id = toIdString(userId);
  if (toIdString(this.owner) === id) return true;
  return this.participants.some((p) => toIdString(p.user) === id);
};

roomSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    roomId: this.roomId,
    title: this.title,
    owner: this.owner,
    participants: this.participants,
    participantCount: this.participants.length,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
