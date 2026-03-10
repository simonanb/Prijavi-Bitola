export const CATEGORIES = [
  { id: 'pothole',          emoji: '🕳️', label: 'Дупка на пат' },
  { id: 'stray_dogs',       emoji: '🐕', label: 'Улични кучиња' },
  { id: 'illegal_parking',  emoji: '🚗', label: 'Нелегално паркирање' },
  { id: 'streetlight',      emoji: '💡', label: 'Расипано осветлување' },
  { id: 'illegal_dumping',  emoji: '🗑️', label: 'Диво отпадно место' },
  { id: 'water_leak',       emoji: '🌊', label: 'Пробиена водоводна цевка' },
  { id: 'other',            emoji: '🔧', label: 'Друго' },
];

export const STATUSES = {
  submitted: { label: 'Поднесено',  bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-400' },
  in_review: { label: 'Во преглед', bg: 'bg-blue-100',  text: 'text-blue-800',  border: 'border-blue-300',  dot: 'bg-blue-400' },
  resolved:  { label: 'Решено',     bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-400' },
};

// Bitola city center
export const BITOLA_CENTER = [41.0297, 21.3294];
export const DEFAULT_ZOOM  = 14;
