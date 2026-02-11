export interface UnitTheme {
  primary: string;
  neonCyan: string;
  ring: string;
  glowPrimary: string;
  glowCyan: string;
  label: string;
}

const UNIT_THEMES: Record<string, UnitTheme> = {
  'sao-joao-da-boa-vista': {
    primary: '217 91% 60%',
    neonCyan: '190 90% 55%',
    ring: '217 91% 60%',
    glowPrimary: '0 0 24px hsl(217 91% 60% / 0.2), 0 0 48px hsl(217 91% 60% / 0.08)',
    glowCyan: '0 0 24px hsl(190 90% 55% / 0.2), 0 0 48px hsl(190 90% 55% / 0.08)',
    label: 'Azul',
  },
  'porto-ferreira': {
    primary: '160 84% 45%',
    neonCyan: '172 66% 50%',
    ring: '160 84% 45%',
    glowPrimary: '0 0 24px hsl(160 84% 45% / 0.2), 0 0 48px hsl(160 84% 45% / 0.08)',
    glowCyan: '0 0 24px hsl(172 66% 50% / 0.2), 0 0 48px hsl(172 66% 50% / 0.08)',
    label: 'Esmeralda',
  },
};

const DEFAULT_THEME: UnitTheme = {
  primary: '262 80% 65%',
  neonCyan: '280 70% 60%',
  ring: '262 80% 65%',
  glowPrimary: '0 0 24px hsl(262 80% 65% / 0.2), 0 0 48px hsl(262 80% 65% / 0.08)',
  glowCyan: '0 0 24px hsl(280 70% 60% / 0.2), 0 0 48px hsl(280 70% 60% / 0.08)',
  label: 'Roxo',
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
