import { Calendar, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal } from '../../lib/types';

interface GoalCardProps {
  goal: Goal;
  canEdit: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, canEdit, onComplete, onDelete }: GoalCardProps) {
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
              onClick={() => onComplete(goal.id)}
              className="p-2 text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
              title="Mark complete"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
