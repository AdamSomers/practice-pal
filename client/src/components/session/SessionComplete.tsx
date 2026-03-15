import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Star, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionCompleteProps {
  durationSeconds: number;
  itemsCompleted: number;
  totalItems: number;
  onDone: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} seconds`;
  return `${m} min ${s > 0 ? `${s} sec` : ''}`;
}

export default function SessionComplete({
  durationSeconds,
  itemsCompleted,
  totalItems,
  onDone,
}: SessionCompleteProps) {
  const confettiRef = useRef(false);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#8b5cf6', '#a78bfa', '#14b8a6', '#fbbf24', '#f472b6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#8b5cf6', '#a78bfa', '#14b8a6', '#fbbf24', '#f472b6'],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const messages = [
    'Amazing practice session!',
    'You crushed it!',
    'Great work today!',
    'Stellar practice!',
    'What a musician!',
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-primary-100 via-white to-primary-50 flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        {/* Celebration icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-warm-400 to-warm-500 flex items-center justify-center shadow-lg mx-auto"
        >
          <PartyPopper className="w-12 h-12 text-white" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-800">{message}</h1>
          <p className="text-gray-500 font-medium">
            Your practice session is complete
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-center gap-1.5 text-primary-500 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Duration</span>
            </div>
            <p className="text-lg font-extrabold text-gray-800">
              {formatDuration(durationSeconds)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-center gap-1.5 text-teal-500 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Completed</span>
            </div>
            <p className="text-lg font-extrabold text-gray-800">
              {itemsCompleted}/{totalItems}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDone}
          className="w-full px-6 py-4 bg-warm-500 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:bg-warm-600 transition-colors"
        >
          See Your Reward!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
