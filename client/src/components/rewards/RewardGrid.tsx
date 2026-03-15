import { motion } from 'framer-motion';
import type { SessionReward } from '../../lib/types';

interface RewardGridProps {
  rewards: SessionReward[];
}

export default function RewardGrid({ rewards }: RewardGridProps) {
  if (rewards.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Complete a practice session to earn your first reward!
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rewards.map((reward, i) => (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
          className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-xl cursor-default"
          title={`${reward.category} - ${new Date(reward.earnedAt).toLocaleDateString()}`}
        >
          {reward.emoji}
        </motion.div>
      ))}
    </div>
  );
}
