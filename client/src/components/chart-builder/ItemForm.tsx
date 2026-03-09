import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChartCategory, ChartItemConfig } from '../../lib/types';
import KeySelector from './KeySelector';
import ModifierSelector from './ModifierSelector';
import PieceCombobox from './PieceCombobox';

interface ItemFormProps {
  category: ChartCategory;
  studioId?: string;
  initialConfig?: ChartItemConfig;
  initialRepetitions?: number;
  onSave: (config: ChartItemConfig, repetitions: number) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ChartCategory, string> = {
  scales: 'Scale',
  arpeggios: 'Arpeggio',
  cadences: 'Cadence',
  repertoire: 'Repertoire',
  sight_reading: 'Sight Reading',
  theory: 'Theory',
  other: 'Other',
};

export default function ItemForm({
  category,
  studioId,
  initialConfig,
  initialRepetitions,
  onSave,
  onClose,
}: ItemFormProps) {
  const PRESETS = [1, 2, 3, 4, 5, 6, 8, 10];
  const lastUsed = Number(localStorage.getItem('pp_last_reps')) || 5;
  const defaultReps = initialRepetitions ?? lastUsed;

  const [config, setConfig] = useState<ChartItemConfig>(
    initialConfig || { modifiers: [] }
  );
  const [repetitions, setRepetitions] = useState(defaultReps);
  const [customMode, setCustomMode] = useState(!PRESETS.includes(defaultReps));
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customMode) customInputRef.current?.focus();
  }, [customMode]);

  const update = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pp_last_reps', String(repetitions));
    onSave(config, repetitions);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-800">
            {initialConfig ? 'Edit' : 'Add'} {CATEGORY_LABELS[category]}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category-specific fields */}
          {renderCategoryFields(category, config, update, studioId)}

          {/* Repetitions - common to all */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Repetitions
            </label>
            {customMode ? (
              <div className="flex gap-2">
                <input
                  ref={customInputRef}
                  type="number"
                  min={1}
                  max={99}
                  value={repetitions}
                  onChange={(e) => setRepetitions(Math.max(1, Number(e.target.value)))}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (PRESETS.includes(repetitions)) setCustomMode(false);
                    else setCustomMode(false);
                  }}
                  className="px-3 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <select
                value={PRESETS.includes(repetitions) ? repetitions : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setCustomMode(true);
                  } else {
                    setRepetitions(Number(e.target.value));
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
              >
                {PRESETS.map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
                <option value="custom">More...</option>
              </select>
            )}
          </div>

          {/* Modifiers */}
          <ModifierSelector
            value={config.modifiers || []}
            onChange={(mods) => update('modifiers', mods)}
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={config.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Optional notes for this item..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              {initialConfig ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function renderCategoryFields(
  category: ChartCategory,
  config: ChartItemConfig,
  update: (key: string, value: unknown) => void,
  studioId?: string,
) {
  switch (category) {
    case 'scales':
      return (
        <>
          <KeySelector
            value={config.key || ''}
            onChange={(k) => update('key', k)}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Scale Type
            </label>
            <select
              value={config.type || ''}
              onChange={(e) => update('type', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
            >
              <option value="">Select type...</option>
              <option value="major">Major</option>
              <option value="natural_minor">Natural Minor</option>
              <option value="harmonic_minor">Harmonic Minor</option>
              <option value="melodic_minor">Melodic Minor</option>
              <option value="chromatic">Chromatic</option>
              <option value="pentatonic">Pentatonic</option>
              <option value="blues">Blues</option>
              <option value="whole_tone">Whole Tone</option>
            </select>
          </div>
          <TextInput
            label="BPM (optional)"
            value={config.bpm?.toString() || ''}
            onChange={(v) => update('bpm', v ? Number(v) : undefined)}
            type="number"
            placeholder="e.g., 80"
          />
        </>
      );

    case 'arpeggios':
      return (
        <>
          <KeySelector
            value={config.key || ''}
            onChange={(k) => update('key', k)}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Arpeggio Type
            </label>
            <select
              value={config.type || ''}
              onChange={(e) => update('type', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
            >
              <option value="">Select type...</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="diminished">Diminished</option>
              <option value="augmented">Augmented</option>
              <option value="dominant_7th">Dominant 7th</option>
              <option value="major_7th">Major 7th</option>
              <option value="minor_7th">Minor 7th</option>
            </select>
          </div>
          <TextInput
            label="BPM (optional)"
            value={config.bpm?.toString() || ''}
            onChange={(v) => update('bpm', v ? Number(v) : undefined)}
            type="number"
            placeholder="e.g., 80"
          />
        </>
      );

    case 'cadences':
      return (
        <>
          <KeySelector
            value={config.key || ''}
            onChange={(k) => update('key', k)}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Cadence Type
            </label>
            <select
              value={config.type || ''}
              onChange={(e) => update('type', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition"
            >
              <option value="">Select type...</option>
              <option value="perfect">Perfect (V-I)</option>
              <option value="plagal">Plagal (IV-I)</option>
              <option value="imperfect">Imperfect</option>
              <option value="deceptive">Deceptive (V-vi)</option>
            </select>
          </div>
        </>
      );

    case 'repertoire':
      return (
        <>
          <PieceCombobox
            studioId={studioId || ''}
            piece={config.piece || ''}
            composer={config.composer || ''}
            onPieceChange={(v) => update('piece', v)}
            onComposerChange={(v) => update('composer', v)}
          />
          <TextInput
            label="Movement / Section"
            value={config.movement || ''}
            onChange={(v) => update('movement', v)}
            placeholder="e.g., 1st Movement"
          />
          <TextInput
            label="Measures"
            value={config.measures || ''}
            onChange={(v) => update('measures', v)}
            placeholder="e.g., 1-32"
          />
          <TextInput
            label="BPM (optional)"
            value={config.bpm?.toString() || ''}
            onChange={(v) => update('bpm', v ? Number(v) : undefined)}
            type="number"
            placeholder="e.g., 120"
          />
        </>
      );

    case 'sight_reading':
      return (
        <>
          <TextInput
            label="Description"
            value={config.description || ''}
            onChange={(v) => update('description', v)}
            placeholder="e.g., Grade 3 sight reading exercise"
          />
          <KeySelector
            value={config.key || ''}
            onChange={(k) => update('key', k)}
          />
        </>
      );

    case 'theory':
      return (
        <>
          <TextInput
            label="Topic"
            value={config.label || ''}
            onChange={(v) => update('label', v)}
            placeholder="e.g., Chord inversions"
          />
          <TextInput
            label="Description"
            value={config.description || ''}
            onChange={(v) => update('description', v)}
            placeholder="Describe the theory exercise..."
          />
        </>
      );

    case 'other':
      return (
        <>
          <TextInput
            label="Title"
            value={config.label || ''}
            onChange={(v) => update('label', v)}
            placeholder="e.g., Warm-up routine"
          />
          <TextInput
            label="Description"
            value={config.description || ''}
            onChange={(v) => update('description', v)}
            placeholder="Describe the exercise..."
          />
        </>
      );

    default:
      return null;
  }
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
      />
    </div>
  );
}
