import { useState } from 'react';
import { Pencil, Trash2, GripVertical, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChartCategory, ChartItemConfig } from '../../lib/types';
import { CATEGORIES } from './CategoryPicker';

interface ChartItemCardProps {
  category: ChartCategory;
  config: ChartItemConfig;
  repetitions: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  dragHandleProps?: Record<string, unknown>;
}

function getItemLabel(category: ChartCategory, config: ChartItemConfig): string {
  switch (category) {
    case 'scales': {
      const scaleType = config.type === 'other' ? (config.customType as string) : config.type?.replace(/_/g, ' ');
      return [config.key, scaleType, 'scale'].filter(Boolean).join(' ');
    }
    case 'arpeggios':
      return [config.key, config.type?.replace(/_/g, ' '), 'arpeggio']
        .filter(Boolean)
        .join(' ');
    case 'cadences':
      return [config.key, config.keyType, config.type, 'cadence'].filter(Boolean).join(' ');
    case 'repertoire':
      return [config.piece, config.composer ? `(${config.composer})` : '']
        .filter(Boolean)
        .join(' ');
    case 'sight_reading':
      return config.description || 'Sight reading';
    case 'theory':
      return config.label || 'Theory exercise';
    case 'technique':
      return config.label || 'Technique exercise';
    case 'other':
      return config.label || 'Exercise';
    default:
      return 'Item';
  }
}

export default function ChartItemCard({
  category,
  config,
  repetitions,
  onEdit,
  onDelete,
  onDuplicate,
  dragHandleProps,
}: ChartItemCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const catInfo = CATEGORIES.find((c) => c.key === category);
  const label = getItemLabel(category, config);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-0 group"
    >
      <div className="flex items-center gap-3">
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab text-gray-300 hover:text-gray-400 active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Category icon */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          catInfo?.bg || 'bg-gray-100'
        } ${catInfo?.color || 'text-gray-500'}`}
      >
        {catInfo?.icon || null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate capitalize">{label}</p>
        {(category === 'theory' || category === 'other' || category === 'technique') && config.description && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{config.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
          <span>{repetitions}x</span>
          {category === 'repertoire' && config.practiceMode === 'sections' && config.sectionCount && config.sectionsRepsEach && (
            <>
              <span className="text-gray-300">|</span>
              <span>{config.sectionCount} sections &times; {config.sectionsRepsEach} reps</span>
            </>
          )}
          {category === 'repertoire' && config.movement && (
            <>
              <span className="text-gray-300">|</span>
              <span className="truncate">{config.movement}</span>
            </>
          )}
          {category === 'repertoire' && config.measures && (
            <>
              <span className="text-gray-300">|</span>
              <span>mm. {config.measures}</span>
            </>
          )}
          {config.bpm && (
            <>
              <span className="text-gray-300">|</span>
              <span>{config.bpmMax ? `${config.bpm}-${config.bpmMax}` : config.bpm} BPM</span>
            </>
          )}
          {category === 'sight_reading' && config.key && (
            <>
              <span className="text-gray-300">|</span>
              <span>{config.key}</span>
            </>
          )}
          {config.modifiers && config.modifiers.length > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <span className="truncate">
                {config.modifiers.slice(0, 3).join(', ')}
                {config.modifiers.length > 3 &&
                  ` +${config.modifiers.length - 3}`}
              </span>
            </>
          )}
          {config.notes && (
            <>
              <span className="text-gray-300">|</span>
              <span className="truncate italic">{config.notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setConfirmDelete(true)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-red-600 font-medium">Delete this item?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
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

export { getItemLabel };
