export interface UnitTheme {
  primary: string;
  neonCyan: string;
  ring: string;
  glowPrimary: string;
  glowCyan: string;
  label: string;
}

const STANDARD_THEME_COLORS: Omit<UnitTheme, 'label'> = {
  primary: '42 72% 52%',
  neonCyan: '42 72% 52%',
  ring: '42 72% 52%',
  glowPrimary: '0 0 24px hsl(42 72% 52% / 0.2), 0 0 48px hsl(42 72% 52% / 0.1)',
  glowCyan: '0 0 24px hsl(42 72% 52% / 0.2), 0 0 48px hsl(42 72% 52% / 0.1)',
};

const UNIT_THEMES: Record<string, UnitTheme> = {
  'sao-joao-da-boa-vista': {
    ...STANDARD_THEME_COLORS,
    label: 'Garden',
  },
  'porto-ferreira': {
    ...STANDARD_THEME_COLORS,
    label: 'Garden',
  },
};

const DEFAULT_THEME: UnitTheme = {
  ...STANDARD_THEME_COLORS,
  label: 'Garden',
};

export function getUnitTheme(slug: string): UnitTheme {
  return UNIT_THEMES[slug] || DEFAULT_THEME;
}

export function getThemeColor(slug: string): string {
  const theme = getUnitTheme(slug);
  return `hsl(${theme.primary})`;
}

export function applyUnitTheme(theme: UnitTheme) {
  const root = document.documentElement.style;
  root.setProperty('--primary', theme.primary);
  root.setProperty('--neon-cyan', theme.neonCyan);
  root.setProperty('--ring', theme.ring);
  root.setProperty('--glow-primary', theme.glowPrimary);
  root.setProperty('--glow-cyan', theme.glowCyan);
}
