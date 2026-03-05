import {
  Music,
  Waves,
  PianoIcon,
  BookOpen,
  Eye,
  Lightbulb,
  MoreHorizontal,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChartCategory } from '../../lib/types';

interface CategoryPickerProps {
  onSelect: (category: ChartCategory) => void;
  onClose: () => void;
}

const CATEGORIES: {
  key: ChartCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    key: 'scales',
    label: 'Scales',
    icon: <Music className="w-6 h-6" />,
    color: 'text-primary-600',
    bg: 'bg-primary-100',
  },
  {
    key: 'arpeggios',
    label: 'Arpeggios',
    icon: <Waves className="w-6 h-6" />,
    color: 'text-teal-500',
    bg: 'bg-teal-400/10',
  },
  {
    key: 'cadences',
    label: 'Cadences',
    icon: <PianoIcon className="w-6 h-6" />,
    color: 'text-warm-500',
    bg: 'bg-warm-100',
  },
  {
    key: 'repertoire',
    label: 'Repertoire',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'text-rose-500',
    bg: 'bg-rose-100',
  },
  {
    key: 'sight_reading',
    label: 'Sight Reading',
    icon: <Eye className="w-6 h-6" />,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
  },
  {
    key: 'theory',
    label: 'Theory',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
  },
  {
    key: 'other',
    label: 'Other',
    icon: <MoreHorizontal className="w-6 h-6" />,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
  },
];

export default function CategoryPicker({
  onSelect,
  onClose,
}: CategoryPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <h2 className="text-xl font-extrabold text-gray-800 mb-4">
          Choose Category
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(cat.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all ${cat.bg}`}
            >
              <div className={cat.color}>{cat.icon}</div>
              <span className="text-sm font-bold text-gray-800">
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

export { CATEGORIES };
