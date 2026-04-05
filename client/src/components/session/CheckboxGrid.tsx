import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { playCheckSound, playUncheckSound } from '../../lib/sounds';
import type { ChartCategory, ChartItemConfig } from '../../lib/types';
import { getItemLabel } from '../chart-builder/ChartItemCard';
import { CATEGORIES } from '../chart-builder/CategoryPicker';

function getItemDetails(category: ChartCategory, config: ChartItemConfig): string {
  const parts: string[] = [];
  switch (category) {
    case 'scales':
    case 'arpeggios':
      if (config.key) parts.push(config.key);
      if (config.type === 'other' && config.customType) {
        parts.push(config.customType as string);
      } else if (config.type) {
        parts.push(config.type.replace(/_/g, ' '));
      }
      if (config.bpm) parts.push(`${config.bpm} BPM`);
      break;
    case 'cadences':
      if (config.key) parts.push(config.key);
      if (config.keyType) parts.push(config.keyType as string);
      if (config.type) parts.push(config.type);
      break;
    case 'repertoire':
      if (config.composer) parts.push(config.composer);
      if (config.movement) parts.push(config.movement);
      if (config.measures) parts.push(`mm. ${config.measures}`);
      if (config.bpm) parts.push(`${config.bpm} BPM`);
      break;
    case 'sight_reading':
      if (config.key) parts.push(config.key);
      if (config.description) parts.push(config.description);
      break;
    case 'theory':
    case 'other':
      if (config.description) parts.push(config.description);
      break;
  }
  if (config.notes) parts.push(config.notes);
  return parts.join(' \u00B7 ');
}

interface CheckboxGridProps {
  itemId: string;
  category: ChartCategory;
  config: ChartItemConfig;
  repetitions: number;
  checked: Set<number>;
  onCheck: (repetitionNumber: number) => void;
  onUncheck: (repetitionNumber: number) => void;
}

export default function CheckboxGrid({
  itemId,
  category,
  config,
  repetitions,
  checked,
  onCheck,
  onUncheck,
}: CheckboxGridProps) {
  const label = getItemLabel(category, config);
  const catInfo = CATEGORIES.find((c) => c.key === category);
  const allChecked = checked.size === repetitions;

  const handleToggle = (repNum: number) => {
    if (checked.has(repNum)) {
      playUncheckSound();
      onUncheck(repNum);
    } else {
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
          {getItemDetails(category, config) && (
            <p className="text-[11px] text-gray-500 truncate">
              {getItemDetails(category, config)}
            </p>
          )}
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

          return (
            <motion.button
              key={repNum}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleToggle(repNum)}
              className={`relative w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                isChecked
                  ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-400'
              }`}
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
