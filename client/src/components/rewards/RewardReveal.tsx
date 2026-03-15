import { motion } from 'framer-motion';
import { playRewardSound } from '../../lib/sounds';
import { useEffect, useRef } from 'react';
import { rewardCategories } from '../../lib/rewardEmojis';

interface RewardRevealProps {
  emoji: string;
  category: string;
  onCollect: () => void;
}

export default function RewardReveal({ emoji, category, onCollect }: RewardRevealProps) {
  const soundRef = useRef(false);

  useEffect(() => {
    if (!soundRef.current) {
      soundRef.current = true;
      playRewardSound();
    }
  }, []);

  const categoryLabel = rewardCategories[category]?.label || category;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-warm-100 via-white to-primary-50 flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.5, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          className="relative mx-auto w-32 h-32 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-warm-200/50 animate-pulse" />
          <span className="text-7xl relative z-10">{emoji}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-1"
        >
          <h2 className="text-2xl font-extrabold text-gray-800">You earned a reward!</h2>
          <p className="text-sm font-semibold text-gray-400 uppercase">{categoryLabel}</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCollect}
          className="w-full px-6 py-4 bg-warm-500 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:bg-warm-600 transition-colors"
        >
          Collect!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
