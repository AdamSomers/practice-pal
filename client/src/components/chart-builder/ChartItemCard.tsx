import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChartCategory, ChartItemConfig } from '../../lib/types';
import { CATEGORIES } from './CategoryPicker';

interface ChartItemCardProps {
  category: ChartCategory;
  config: ChartItemConfig;
  repetitions: number;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

function getItemLabel(category: ChartCategory, config: ChartItemConfig): string {
  switch (category) {
    case 'scales':
      return [config.key, config.type?.replace(/_/g, ' '), 'scale']
        .filter(Boolean)
        .join(' ');
    case 'arpeggios':
      return [config.key, config.type?.replace(/_/g, ' '), 'arpeggio']
        .filter(Boolean)
        .join(' ');
    case 'cadences':
      return [config.key, config.type, 'cadence'].filter(Boolean).join(' ');
    case 'repertoire':
      return [config.piece, config.composer ? `(${config.composer})` : '']
        .filter(Boolean)
        .join(' ');
    case 'sight_reading':
      return config.description || 'Sight reading';
    case 'theory':
      return config.label || 'Theory exercise';
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
  dragHandleProps,
}: ChartItemCardProps) {
  const catInfo = CATEGORIES.find((c) => c.key === category);
  const label = getItemLabel(category, config);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 group"
    >
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
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
          <span>{repetitions}x repetitions</span>
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
          {config.bpm && (
            <>
              <span className="text-gray-300">|</span>
              <span>{config.bpm} BPM</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export { getItemLabel };
