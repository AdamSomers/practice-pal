import { useState } from 'react';
import { Calendar, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Goal } from '../../lib/types';

interface GoalCardProps {
  goal: Goal;
  canEdit: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, canEdit, onComplete, onDelete }: GoalCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const isCompleted = !!goal.completedAt;
  const rewardDisplay = goal.rewardType === 'emoji'
    ? goal.rewardEmoji || '🏆'
    : goal.customRewardTitle || 'Custom reward';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border p-4 ${
        isCompleted ? 'border-teal-200 bg-teal-50/30' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-2xl">{goal.rewardType === 'emoji' ? (goal.rewardEmoji || '🏆') : '🎁'}</div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isCompleted ? 'text-teal-700 line-through' : 'text-gray-800'}`}>
            {goal.title}
          </p>
          {goal.description && (
            <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {goal.targetDate && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {new Date(goal.targetDate).toLocaleDateString()}
              </span>
            )}
            {goal.rewardType === 'custom' && goal.customRewardTitle && (
              <span className="text-xs font-medium text-warm-500">
                Reward: {rewardDisplay}
              </span>
            )}
            {isCompleted && (
              <span className="text-xs font-bold text-teal-600">Completed!</span>
            )}
          </div>
        </div>
        {canEdit && !isCompleted && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirmComplete(true)}
              className="p-2 text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
              title="Mark complete"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {canEdit && isCompleted && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {confirmComplete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-teal-700 font-medium">Mark this goal complete?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmComplete(false)}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onComplete(goal.id);
                    setConfirmComplete(false);
                  }}
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Complete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-red-600 font-medium">Delete this goal?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(goal.id)}
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
