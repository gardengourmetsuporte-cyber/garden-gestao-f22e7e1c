export interface UnitTheme {
  primary: string;
  neonCyan: string;
  ring: string;
  glowPrimary: string;
  glowCyan: string;
  label: string;
}

const STANDARD_THEME_COLORS: Omit<UnitTheme, 'label'> = {
  primary: '215 50% 28%',
  neonCyan: '215 50% 28%',
  ring: '215 50% 28%',
  glowPrimary: '0 0 24px hsl(215 50% 28% / 0.25), 0 0 48px hsl(215 50% 28% / 0.12)',
  glowCyan: '0 0 24px hsl(215 50% 28% / 0.25), 0 0 48px hsl(215 50% 28% / 0.12)',
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
