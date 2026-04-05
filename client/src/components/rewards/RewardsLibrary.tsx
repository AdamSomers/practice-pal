import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomRewards, createCustomReward, deleteCustomReward } from '../../lib/api';
import type { CustomReward } from '../../lib/types';

interface RewardsLibraryProps {
  studioId: string;
}

export default function RewardsLibrary({ studioId }: RewardsLibraryProps) {
  const [rewards, setRewards] = useState<CustomReward[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getCustomRewards(studioId).then(setRewards).catch(console.error);
  }, [studioId]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const reward = await createCustomReward({
        studioId,
        title: title.trim(),
      });
      setRewards(prev => [...prev, reward]);
      setTitle('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create reward:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomReward(id);
      setRewards(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete reward:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Custom rewards can be attached to practice goals.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Boba tea trip"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={() => { setShowForm(false); setTitle(''); }}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rewards.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-3">
          No custom rewards yet.
        </p>
      )}

      <div className="space-y-1">
        {rewards.map(reward => (
          <div key={reward.id} className="rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 p-2.5">
              <span className="text-lg w-7 text-center">{reward.emoji || '🎁'}</span>
              <span className="flex-1 text-sm font-medium text-gray-700">{reward.title}</span>
              {confirmDeleteId === reward.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      handleDelete(reward.id);
                      setConfirmDeleteId(null);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(reward.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
