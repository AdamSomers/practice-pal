export const rewardCategories: Record<string, { label: string; emojis: string[] }> = {
  animals: {
    label: 'Animals',
    emojis: ['🐶', '🐱', '🐰', '🦊', '🐼', '🐨', '🦁', '🐸', '🐧', '🦋'],
  },
  sports: {
    label: 'Sports',
    emojis: ['⚽', '🏀', '🎾', '⚾', '🏈', '🏐', '🎳', '🛹', '⛷️', '🏄'],
  },
  flowers: {
    label: 'Flowers',
    emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🌼', '🪷', '🌿', '🍀'],
  },
  spooky: {
    label: 'Spooky',
    emojis: ['👻', '🎃', '💀', '🦇', '🕷️', '🧛', '🧟', '👽', '🤖', '👾'],
  },
  music: {
    label: 'Music',
    emojis: ['🎵', '🎶', '🎹', '🎸', '🎺', '🥁', '🎻', '🎷', '🪗', '🎤'],
  },
  space: {
    label: 'Space',
    emojis: ['🚀', '🌟', '🪐', '🌙', '☄️', '👩‍🚀', '🛸', '🌌', '⭐', '🌍'],
  },
  food: {
    label: 'Food',
    emojis: ['🍕', '🍦', '🧁', '🍩', '🍪', '🎂', '🍫', '🍬', '🥤', '🍿'],
  },
  nature: {
    label: 'Nature',
    emojis: ['🌈', '🌊', '⛰️', '🌲', '🍄', '🦜', '🐬', '🌅', '❄️', '🔥'],
  },
};

export const defaultCategories = ['animals', 'music', 'food'];

export const goalRewardEmojis = [
  '🏆', '🥇', '⭐', '💎', '👑', '🎖️', '🌟', '💫', '🎯', '🔮',
];

export function pickRandomEmoji(categories: string[]): { emoji: string; category: string } | null {
  const validCategories = categories.filter(cat => cat in rewardCategories);
  if (validCategories.length === 0) return null;
  const category = validCategories[Math.floor(Math.random() * validCategories.length)];
  const emojis = rewardCategories[category].emojis;
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return { emoji, category };
}
