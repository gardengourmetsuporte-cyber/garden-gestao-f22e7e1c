export interface UnitTheme {
  primary: string;
  neonCyan: string;
  ring: string;
  glowPrimary: string;
  glowCyan: string;
  label: string;
}

const STANDARD_THEME_COLORS: Omit<UnitTheme, 'label'> = {
  primary: '152 56% 36%',
  neonCyan: '160 45% 40%',
  ring: '152 56% 36%',
  glowPrimary: '0 0 24px hsl(152 56% 36% / 0.2), 0 0 48px hsl(152 56% 36% / 0.08)',
  glowCyan: '0 0 24px hsl(160 45% 40% / 0.2), 0 0 48px hsl(160 45% 40% / 0.08)',
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
