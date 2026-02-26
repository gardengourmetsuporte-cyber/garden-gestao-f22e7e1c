

## Problemas Identificados

1. **FAB central feio** — o botão com gradient indigo→violet sobre fundo escuro parece fraco/apagado, precisa de mais presença visual
2. **Card principal sem contraste** — `--card: 240 5% 10%` (≈#18181B) sobre `--background: 240 6% 6%` (≈#0F0F11) dá diferença de apenas 4% de luminosidade — quase invisível
3. **Indigo/Violet fraco** — o primary `234 89% 74%` é pastel demais no dark mode, falta punch

## Plano de Mudanças

### 1. `src/components/layout/BottomTabBar.tsx` — FAB redesenhado

Redesenhar o botão central:
- Aumentar para **60x60px** (de 56px) com `rounded-full`
- Background: **branco puro** no dark mode (`hsl(0 0% 100%)`) com ícone em preto — padrão Linear/Vercel (FAB neutro que contrasta com tudo)
- Glow ring: anel sutil com indigo blur atrás
- Border: `1px solid hsl(0 0% 100% / 0.2)` — sutil, premium
- Shadow: forte drop shadow preto para "flutuar"
- Hover: scale 1.08, Active: scale 0.92

```text
       ╭──────╮
      │  ╋    │   ← branco, ícone preto, glow indigo sutil
       ╰──────╯
```

### 2. `src/index.css` — Aumentar contraste dos cards e intensificar primary

**Dark mode (`.dark`)**:
| Token | Atual | Novo | Razão |
|-------|-------|------|-------|
| `--background` | `240 6% 6%` | `240 6% 4%` | Mais preto (≈ #0A0A0B) |
| `--card` | `240 5% 10%` | `240 5% 12%` | Card mais claro para contrastar (≈ #1E1E21) — +8% diferença |
| `--primary` | `234 89% 74%` | `234 89% 67%` | Indigo mais saturado e vibrante, menos pastel |
| `--ring` | `234 89% 74%` | `234 89% 67%` | Match primary |
| `--border` | `240 4% 18%` | `240 4% 20%` | Bordas um pouco mais visíveis |
| `--gradient-brand` | com `74%` | com `67%` | Gradient mais intenso |
| Todos os glows | com `74%` | com `67%` | Glows mais vibrantes |

**Light mode** — primary de `64%` para `58%` para mais contraste sobre branco

### 3. `src/lib/unitThemes.ts` — Sync primary para `234 89% 67%`

### 4. `tailwind.config.ts` — Sync `glow-border` keyframe para `234 89% 67%`

### Resultado
- FAB branco premium que se destaca em qualquer tema (padrão Linear/Notion)
- Cards com +8% de diferença de luminosidade vs fundo — claramente visíveis
- Indigo mais vibrante e "punchy" sem ser gritante

### Arquivos editados (4)
| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/BottomTabBar.tsx` | FAB redesenhado: branco, maior, shadow forte |
| `src/index.css` | Background mais escuro, card mais claro, primary mais saturado |
| `src/lib/unitThemes.ts` | Primary sync |
| `tailwind.config.ts` | Keyframe sync |

