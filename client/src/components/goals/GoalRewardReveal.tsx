import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playRewardSound } from '../../lib/sounds';

interface GoalRewardRevealProps {
  goal: {
    title: string;
    rewardType: 'emoji' | 'custom';
    rewardEmoji: string | null;
    customRewardTitle: string | null;
  };
  onDismiss: () => void;
}

export default function GoalRewardReveal({ goal, onDismiss }: GoalRewardRevealProps) {
  const confettiRef = useRef(false);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    playRewardSound();

    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#8b5cf6', '#a78bfa', '#14b8a6', '#fbbf24', '#f472b6'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#8b5cf6', '#a78bfa', '#14b8a6', '#fbbf24', '#f472b6'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const displayEmoji = goal.rewardType === 'emoji' ? (goal.rewardEmoji || '🏆') : '🎁';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-warm-100 via-white to-primary-50 flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          className="relative mx-auto w-36 h-36 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-warm-200/50 animate-pulse" />
          <span className="text-8xl relative z-10">{displayEmoji}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-extrabold text-gray-800">Goal Achieved!</h2>
          <p className="text-base font-semibold text-primary-600">{goal.title}</p>
          {goal.rewardType === 'custom' && goal.customRewardTitle && (
            <p className="text-lg font-bold text-warm-500">{goal.customRewardTitle}</p>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDismiss}
          className="w-full px-6 py-4 bg-primary-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:bg-primary-700 transition-colors"
        >
          Awesome!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
