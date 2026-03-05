import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface ModifierSelectorProps {
  value: string[];
  onChange: (modifiers: string[]) => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Hands separate',
  'Hands together',
  'Contrary motion',
  'Staccato',
  'Legato',
  'Forte',
  'Piano',
  'With metronome',
  'Slow tempo',
  'Performance tempo',
  'Eyes closed',
  'From memory',
];

export default function ModifierSelector({
  value,
  onChange,
  suggestions = DEFAULT_SUGGESTIONS,
}: ModifierSelectorProps) {
  const [customInput, setCustomInput] = useState('');

  const toggleModifier = (mod: string) => {
    if (value.includes(mod)) {
      onChange(value.filter((m) => m !== mod));
    } else {
      onChange([...value, mod]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        Modifiers
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {suggestions.map((mod) => (
          <button
            key={mod}
            type="button"
            onClick={() => toggleModifier(mod)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              value.includes(mod)
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Selected custom modifiers */}
      {value.filter((m) => !suggestions.includes(m)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value
            .filter((m) => !suggestions.includes(m))
            .map((mod) => (
              <span
                key={mod}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-full text-xs font-semibold"
              >
                {mod}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((m) => m !== mod))}
                  className="hover:bg-teal-600 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom modifier..."
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-3 py-2 bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold hover:bg-primary-200 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
