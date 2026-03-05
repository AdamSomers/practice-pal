import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  percentage: number;
}

const FLOWER_COLORS = [
  '#8b5cf6', // purple
  '#a78bfa',
  '#14b8a6', // teal
  '#2dd4bf',
  '#f59e0b', // amber
  '#fbbf24',
  '#ec4899', // pink
  '#f472b6',
  '#6366f1', // indigo
  '#818cf8',
];

export default function ProgressIndicator({
  percentage,
}: ProgressIndicatorProps) {
  const flowerCount = 10;
  const visibleFlowers = Math.floor((percentage / 100) * flowerCount);

  return (
    <div className="bg-gradient-to-b from-teal-50 to-green-50 rounded-2xl p-4 border border-teal-100/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
          Practice Garden
        </span>
        <span className="text-sm font-bold text-teal-700">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Garden */}
      <div className="flex items-end justify-around h-16 px-2">
        {Array.from({ length: flowerCount }, (_, i) => {
          const isVisible = i < visibleFlowers;
          const color = FLOWER_COLORS[i % FLOWER_COLORS.length];
          const height = 24 + Math.random() * 16;

          return (
            <div key={i} className="flex flex-col items-center">
              {isVisible ? (
                <motion.div
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 12,
                    delay: 0.05 * i,
                  }}
                  className="flex flex-col items-center"
                >
                  {/* Flower head */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className="mb-[-2px]"
                  >
                    {[0, 60, 120, 180, 240, 300].map((angle) => (
                      <ellipse
                        key={angle}
                        cx="9"
                        cy="9"
                        rx="3.5"
                        ry="6"
                        fill={color}
                        opacity="0.85"
                        transform={`rotate(${angle} 9 9)`}
                      />
                    ))}
                    <circle cx="9" cy="9" r="2.5" fill="#fbbf24" />
                  </svg>
                  {/* Stem */}
                  <div
                    className="w-0.5 bg-green-400 rounded-full"
                    style={{ height: `${height}px` }}
                  />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center opacity-20">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mb-[-2px]" />
                  <div className="w-0.5 h-4 bg-gray-300 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ground */}
      <div className="h-2 bg-gradient-to-r from-green-200 via-green-300 to-green-200 rounded-full mt-1" />
    </div>
  );
}
