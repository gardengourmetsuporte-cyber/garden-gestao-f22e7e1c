

## Migração Completa de Cores: Padrão SaaS Profissional

### Análise das Referências
Os maiores SaaS do mundo convergem para uma paleta primária baseada em **Indigo/Violet**:
- **Linear**: Indigo `#5E6AD2` (hsl 235 47% 58%)
- **Stripe**: Violet `#635BFF` (hsl 245 100% 68%)
- **Vercel/GitHub**: Neutro preto/branco
- **Mercury**: Blue `#4361EE`
- **Notion**: Preto/branco com acentos mínimos

A escolha mais segura e universal é um **Indigo** limpo — profissional, neutro, funciona perfeitamente em dark e light mode.

### Paleta Proposta

```text
PRIMARY (Indigo):     hsl(234 89% 74%)  ≈ #818CF8  (Indigo-400)
  - Dark foreground:  hsl(0 0% 5%)
  - Light foreground: hsl(0 0% 100%)

ACCENT (Violet):      hsl(258 90% 66%)  ≈ #8B5CF6
  
BACKGROUNDS (Dark):
  - background:       hsl(240 6% 6%)    ≈ #0F0F11  (quase preto, leve tom frio)
  - card:             hsl(240 5% 10%)   ≈ #18181B
  - popover:          hsl(240 5% 9%)
  - secondary:        hsl(240 4% 14%)
  - muted:            hsl(240 4% 16%)
  - border:           hsl(240 4% 18%)
  - input:            hsl(240 4% 12%)

BACKGROUNDS (Light):
  - background:       hsl(0 0% 99%)     ≈ #FCFCFC
  - card:             hsl(0 0% 100%)
  - primary:          hsl(234 89% 64%)   (mais saturado para contraste)
  
SEMANTIC (iguais aos padrões):
  - success:          hsl(142 71% 45%)   (verde)
  - destructive:      hsl(0 84% 60%)     (vermelho)
  - warning:          hsl(38 92% 50%)    (âmbar)
```

### Mudanças por Arquivo

**1. `src/index.css`** — Migração completa de ~100 referências de `42 72% 52%` (gold) para indigo

| Seção | Mudança |
|-------|---------|
| `:root` tokens | `--neon-cyan` → indigo, `--neon-purple` → violet real, `--garden-gold` removido |
| `.dark` | Background preto real (`240 6% 6%`), primary indigo, todos os glows/gradients com indigo |
| `:root:not(.dark)` | Primary indigo mais saturado, backgrounds brancos puros |
| `--gradient-brand` | `indigo → violet` em vez de `gold → green` |
| `--gradient-gold` | Renomeado conceitualmente para `--gradient-brand-rich` com tons indigo/violet |
| Todas as hardcoded `hsl(42 72% 52% / ...)` | Substituídas por `hsl(var(--primary) / ...)` ou novo indigo |
| `.list-command` border-left | Indigo |
| `.tab-command-active` | Indigo |
| `.fab-neon-border` | Indigo → Violet |
| `.nav-bar-neon-glow` | Indigo |
| `.text-gradient-gold` → `.text-gradient-gold` | Cores indigo/violet |
| `.bg-gradient-animated` | Indigo → Violet loop |
| `.gold-shimmer` | Shimmer com tom indigo |
| `.animate-gold-pulse` | Pulse com indigo |
| `.border-gradient-animated` | Rotating gradient indigo/violet |
| `neonBorderPulse` | Indigo |
| `neonPulse` | Indigo |
| `.achievement-shimmer` | Indigo sutil |
| `.finance-hero-card` | Dark surfaces com glow indigo |

**2. `src/lib/unitThemes.ts`** — Atualizar `STANDARD_THEME_COLORS`

| Token | Novo Valor |
|-------|-----------|
| `primary` | `234 89% 74%` |
| `neonCyan` | `234 89% 74%` |
| `ring` | `234 89% 74%` |
| `glowPrimary` | Glow com indigo |
| `glowCyan` | Glow com indigo |

**3. `tailwind.config.ts`** — Keyframe `glow-border` com indigo

**4. `src/components/layout/BottomTabBar.tsx`** — FAB hardcoded colors

| Elemento | Mudança |
|----------|---------|
| Glow ring `div` | `hsl(42 72% 52% / ...)` → `hsl(var(--primary) / ...)` |
| FAB `boxShadow` | Indigo glow |
| FAB `border` | `hsl(var(--primary) / 0.6)` |

### Resultado Visual
- **Dark mode**: Fundo quase preto (#0F0F11), cards cinza neutro escuro, primary indigo vibrante — idêntico a Linear/Stripe
- **Light mode**: Fundo branco puro, indigo com bom contraste WCAG AA
- **Gradientes**: Indigo → Violet (elegante, profissional)
- **Glows**: Tom azulado frio em vez de dourado quente

### Arquivos Editados (4)
| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Migração completa gold → indigo (~100 referências) |
| `src/lib/unitThemes.ts` | Tokens padronizados com indigo |
| `tailwind.config.ts` | Keyframe glow-border |
| `src/components/layout/BottomTabBar.tsx` | FAB colors dinâmicos |

