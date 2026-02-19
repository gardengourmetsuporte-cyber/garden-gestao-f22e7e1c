/**
 * Creative default avatar using initials + deterministic gradient
 * for users without a profile photo.
 */

const GRADIENT_PAIRS = [
  ['hsl(280 70% 55%)', 'hsl(320 70% 55%)'],  // Purple → Pink
  ['hsl(200 80% 50%)', 'hsl(170 70% 45%)'],   // Blue → Teal
  ['hsl(340 70% 55%)', 'hsl(20 80% 55%)'],    // Rose → Orange
  ['hsl(160 60% 45%)', 'hsl(200 70% 50%)'],   // Green → Blue
  ['hsl(30 80% 55%)', 'hsl(50 80% 50%)'],     // Orange → Yellow
  ['hsl(250 60% 55%)', 'hsl(200 70% 55%)'],   // Indigo → Sky
  ['hsl(0 70% 55%)', 'hsl(330 70% 50%)'],     // Red → Magenta
  ['hsl(180 60% 45%)', 'hsl(140 60% 45%)'],   // Cyan → Emerald
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

interface DefaultAvatarProps {
  name: string;
  size: number;
  userId?: string;
}

export function DefaultAvatar({ name, size, userId }: DefaultAvatarProps) {
  const seed = userId || name;
  const idx = hashString(seed) % GRADIENT_PAIRS.length;
  const [from, to] = GRADIENT_PAIRS[idx];
  const initials = getInitials(name);
  const fontSize = Math.max(size * 0.38, 11);

  return (
    <div
      className="rounded-full flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `inset 0 -2px 6px rgba(0,0,0,0.15)`,
      }}
    >
      <span
        className="font-bold text-white"
        style={{
          fontSize,
          letterSpacing: '0.05em',
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {initials}
      </span>
    </div>
  );
}
