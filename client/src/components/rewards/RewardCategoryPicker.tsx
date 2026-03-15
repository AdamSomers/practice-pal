import { rewardCategories } from '../../lib/rewardEmojis';

interface RewardCategoryPickerProps {
  selected: string[];
  onChange: (categories: string[]) => void;
}

export default function RewardCategoryPicker({ selected, onChange }: RewardCategoryPickerProps) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      if (selected.length > 1) {
        onChange(selected.filter(k => k !== key));
      }
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(rewardCategories).map(([key, { label, emojis }]) => {
        const isSelected = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl">{emojis.slice(0, 3).join('')}</span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                {label}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
