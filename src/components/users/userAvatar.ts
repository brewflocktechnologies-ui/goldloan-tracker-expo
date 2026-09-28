// Avatar initial colors for visual consistency
const AVATAR_COLORS = [
  { bg: '#e6f8ee', text: '#07ba80' }, // Mint (matching design)
  { bg: '#e0f2fe', text: '#0284c7' }, // Sky
  { bg: '#fef3c7', text: '#d97706' }, // Amber
  { bg: '#dcfce7', text: '#16a34a' }, // Green
  { bg: '#f3e8ff', text: '#9333ea' }, // Purple
  { bg: '#fee2e2', text: '#dc2626' }, // Rose
  { bg: '#ffedd5', text: '#ea580c' }, // Orange
  { bg: '#ccfbf1', text: '#0d9488' }, // Teal
];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function getInitials(name?: string) {
  return (name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
