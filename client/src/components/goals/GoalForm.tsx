import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { goalRewardEmojis } from '../../lib/rewardEmojis';
import { getCustomRewards } from '../../lib/api';
import type { CustomReward } from '../../lib/types';

interface GoalFormProps {
  studioId: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    targetDate?: string;
    rewardType: 'emoji' | 'custom';
    rewardEmoji?: string;
    customRewardId?: string;
    customRewardTitle?: string;
  }) => void;
  onClose: () => void;
}

export default function GoalForm({ studioId, onSubmit, onClose }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [rewardType, setRewardType] = useState<'emoji' | 'custom'>('emoji');
  const [rewardEmoji, setRewardEmoji] = useState(goalRewardEmojis[0]);
  const [customRewards, setCustomRewards] = useState<CustomReward[]>([]);
  const [selectedCustomReward, setSelectedCustomReward] = useState<string>('');

  useEffect(() => {
    getCustomRewards(studioId).then(setCustomRewards).catch(console.error);
  }, [studioId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data: Parameters<typeof onSubmit>[0] = {
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate: targetDate || undefined,
      rewardType,
    };

    if (rewardType === 'emoji') {
      data.rewardEmoji = rewardEmoji;
    } else if (selectedCustomReward) {
      const cr = customRewards.find(r => r.id === selectedCustomReward);
      if (cr) {
        data.customRewardId = cr.id;
        data.customRewardTitle = cr.title;
      }
    }

    onSubmit(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">New Goal</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Goal</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Practice every day this week"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="More details..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Target Date (optional)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Reward</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRewardType('emoji')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                rewardType === 'emoji'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Emoji
            </button>
            <button
              type="button"
              onClick={() => setRewardType('custom')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                rewardType === 'custom'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {rewardType === 'emoji' ? (
            <div className="flex flex-wrap gap-2">
              {goalRewardEmojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setRewardEmoji(e)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl border-2 transition-all ${
                    rewardEmoji === e
                      ? 'border-primary-400 bg-primary-50 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          ) : (
            <div>
              {customRewards.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No custom rewards. Add some in Studio Settings first.
                </p>
              ) : (
                <select
                  value={selectedCustomReward}
                  onChange={(e) => setSelectedCustomReward(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">Select a reward...</option>
                  {customRewards.map(cr => (
                    <option key={cr.id} value={cr.id}>
                      {cr.emoji ? `${cr.emoji} ` : ''}{cr.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          Create Goal
        </button>
      </motion.form>
    </motion.div>
  );
}
