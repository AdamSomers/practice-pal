import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { playCheckSound, playUncheckSound } from '../../lib/sounds';
import type { ChartCategory, ChartItemConfig } from '../../lib/types';
import { getItemLabel } from '../chart-builder/ChartItemCard';
import { CATEGORIES } from '../chart-builder/CategoryPicker';

interface CheckboxGridProps {
  itemId: string;
  category: ChartCategory;
  config: ChartItemConfig;
  repetitions: number;
  checked: Set<number>;
  onCheck: (repetitionNumber: number) => void;
  onUncheck: (repetitionNumber: number) => void;
  timerMet: boolean;
  allOtherItemsComplete: boolean;
}

export default function CheckboxGrid({
  itemId,
  category,
  config,
  repetitions,
  checked,
  onCheck,
  onUncheck,
  timerMet,
  allOtherItemsComplete,
}: CheckboxGridProps) {
  const label = getItemLabel(category, config);
  const catInfo = CATEGORIES.find((c) => c.key === category);
  const allChecked = checked.size === repetitions;
  const uncheckedCount = repetitions - checked.size;

  const handleToggle = (repNum: number) => {
    if (checked.has(repNum)) {
      playUncheckSound();
      onUncheck(repNum);
    } else {
      // Lock last checkbox if timer not met
      if (uncheckedCount === 1 && !checked.has(repNum) && !timerMet) {
        return;
      }
      playCheckSound();
      onCheck(repNum);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
        allChecked ? 'border-teal-300 bg-teal-50/30' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            catInfo?.bg || 'bg-gray-100'
          } ${catInfo?.color || 'text-gray-500'}`}
        >
          <div className="scale-75">{catInfo?.icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate capitalize">
            {label}
          </p>
          {config.modifiers && config.modifiers.length > 0 && (
            <p className="text-[11px] text-gray-400 truncate">
              {config.modifiers.join(' / ')}
            </p>
          )}
        </div>
        {allChecked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center"
          >
            <Check className="w-3.5 h-3.5 text-white" />
          </motion.div>
        )}
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: repetitions }, (_, i) => i + 1).map((repNum) => {
          const isChecked = checked.has(repNum);
          const isLocked =
            !isChecked && uncheckedCount === 1 && !timerMet;

          return (
            <motion.button
              key={repNum}
              whileTap={!isLocked ? { scale: 0.85 } : undefined}
              onClick={() => handleToggle(repNum)}
              disabled={isLocked}
              className={`relative w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                isChecked
                  ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                  : isLocked
                  ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-400'
              }`}
              title={
                isLocked
                  ? 'Complete minimum practice time first'
                  : undefined
              }
            >
              {isChecked ? (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <span className="text-xs font-bold">{repNum}</span>
              )}

              {/* Sparkle burst */}
              {isChecked && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 rounded-xl border-2 border-primary-400 pointer-events-none"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
