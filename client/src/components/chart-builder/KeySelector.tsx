interface KeySelectorProps {
  value: string;
  onChange: (key: string) => void;
}

const KEYS = [
  { value: 'C', label: 'C' },
  { value: 'C#/Db', label: 'C# / Db' },
  { value: 'D', label: 'D' },
  { value: 'D#/Eb', label: 'D# / Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#/Gb', label: 'F# / Gb' },
  { value: 'G', label: 'G' },
  { value: 'G#/Ab', label: 'G# / Ab' },
  { value: 'A', label: 'A' },
  { value: 'A#/Bb', label: 'A# / Bb' },
  { value: 'B', label: 'B' },
];

export default function KeySelector({ value, onChange }: KeySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Key</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
      >
        <option value="">Select a key...</option>
        {KEYS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { KEYS };
