import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

interface TimerBarProps {
  targetSeconds: number;
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
  onTargetReached?: () => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerBar({
  targetSeconds,
  isRunning,
  onTimeUpdate,
  onTargetReached,
}: TimerBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  const reachedRef = useRef(false);

  useEffect(() => {
    if (!isRunning) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now() - elapsed * 1000;
    }

    const tick = () => {
      const now = Date.now();
      const newElapsed = Math.floor((now - startTimeRef.current!) / 1000);
      setElapsed(newElapsed);
      onTimeUpdate?.(newElapsed);

      if (newElapsed >= targetSeconds && !reachedRef.current) {
        reachedRef.current = true;
        onTargetReached?.();
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning, targetSeconds, onTimeUpdate, onTargetReached]);

  const progress = Math.min(elapsed / targetSeconds, 1);
  const isComplete = elapsed >= targetSeconds;

  return (
    <div
      className={`rounded-2xl p-4 shadow-md transition-colors duration-500 ${
        isComplete
          ? 'bg-gradient-to-r from-teal-500 to-teal-400'
          : 'bg-white border border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer
            className={`w-5 h-5 ${isComplete ? 'text-white' : 'text-primary-500'}`}
          />
          <span
            className={`text-2xl font-extrabold tabular-nums ${
              isComplete ? 'text-white' : 'text-gray-800'
            }`}
          >
            {formatTime(elapsed)}
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${
            isComplete ? 'text-white/80' : 'text-gray-400'
          }`}
        >
          / {formatTime(targetSeconds)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className={`h-2.5 rounded-full overflow-hidden ${
          isComplete ? 'bg-white/30' : 'bg-gray-100'
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-white'
              : progress > 0.7
              ? 'bg-gradient-to-r from-primary-500 to-teal-400'
              : 'bg-primary-500'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {isComplete && (
        <p className="text-white/90 text-xs font-semibold mt-2 text-center">
          Minimum time reached! Keep going or finish up.
        </p>
      )}
    </div>
  );
}

export { formatTime };
