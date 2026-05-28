import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import Input from '../auth/Input.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../auth/Spinner.jsx';
import { roomsApi } from '../../services/api.js';

export default function CreateRoomModal({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setTitle('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Room title is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await roomsApi.create({ title: title.trim() });
      const room = data.data.room;
      onCreated?.(room);
      handleClose();
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      const messages = err.data?.errors;
      setError(Array.isArray(messages) ? messages.join('. ') : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create interview room">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <Input
          id="room-title"
          label="Room title"
          placeholder="e.g. Senior C++ — System Design"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          maxLength={80}
        />

        <p className="text-xs text-accent-dim">
          A shareable room ID like <span className="font-mono text-accent-muted">cpp-7F3K2A</span>{' '}
          will be generated automatically.
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" />
                Creating...
              </>
            ) : (
              'Create room'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
