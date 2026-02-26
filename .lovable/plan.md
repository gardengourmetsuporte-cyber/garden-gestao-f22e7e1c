

## Rebranding: "Garden Gestão" — Paleta Emerald + Teal

### Resumo
Rebranding completo: padronizar o nome "Garden Gestão" em todo o sistema, trocar a paleta de cores de azul/roxo para Emerald + Teal, usar o logo original do Garden (`src/assets/logo.png`) em vez do `atlas-icon.png`, e equilibrar ambos os temas (dark e light).

---

### 1. Nome e Textos (Todas as referências "Atlas" → "Garden")

**Arquivos afetados (11):**
- `index.html` — title, og:title, apple-mobile-web-app-title → "Garden Gestão"
- `src/pages/Auth.tsx` — import logo, alt texts, `<h1>Atlas</h1>` → `Garden`, subtítulo "Gestão Inteligente"
- `src/components/PageLoader.tsx` — import logo, alt text
- `src/components/layout/AppLayout.tsx` — import logo, alt texts (mobile header + desktop sidebar)
- `src/pages/Invite.tsx` — import logo, alt text
- `src/pages/GamificationPlay.tsx` — import logo
- `src/components/landing/LandingNavbar.tsx` — import logo, alt text, nome "Atlas" → "Garden"
- `src/components/landing/FooterSection.tsx` — import logo, textos, email contato
- `src/components/landing/HeroSection.tsx` — texto "o Atlas cuida dos números" → "o Garden cuida dos números", alt img
- `src/components/landing/FAQSection.tsx` — "O Atlas funciona" → "O Garden funciona"
- `src/components/settings/TeamManagement.tsx` — texto de convite WhatsApp "no Atlas" → "no Garden"
- `src/lib/unitThemes.ts` — label "Azul Atlas" → "Azul Garden"
- `src/index.css` — comentário "Garden Gestão" (já está correto)

**Ação:** Em todos estes arquivos, trocar `import atlasIcon from '@/assets/atlas-icon.png'` por `import gardenLogo from '@/assets/logo.png'` e substituir todas as strings "Atlas" por "Garden".

---

### 2. Nova Paleta de Cores — Emerald + Teal

Substituir a paleta azul/roxo atual por tons verdes esmeralda e teal.

**Tokens alterados em `src/index.css`:**

```
DARK THEME (valores HSL):
--primary:           160 84% 39%     (era 220 85% 58% — azul)
--accent:            172 66% 50%     (era 262 70% 55% — roxo)
--ring:              160 84% 39%
--neon-cyan:         172 66% 50%     (teal — mantém nome mas valor muda)
--neon-green:        142 71% 45%     (mantém — já é verde)
--neon-purple:       160 50% 60%     (agora é um teal claro para manter harmonia)
--gradient-brand:    linear-gradient(135deg, hsl(160 84% 39%), hsl(172 66% 50%))
--glow-primary:      ajustado para emerald
--glow-accent:       ajustado para teal
--shadow-glow:       ajustado

LIGHT THEME:
--primary:           160 70% 36%
--ring:              160 70% 36%
--accent:            172 55% 45%
Glows e gradientes ajustados proporcionalmente
```

**Tokens :root (compartilhados):**
- `--neon-cyan`: `172 66% 50%` (teal)
- `--neon-purple`: `160 50% 60%` (teal claro, para não quebrar componentes que usam)

---

### 3. Landing Page — Gradientes Atualizados

Todos os `neon-green` e `neon-cyan` já são variáveis CSS, então mudam automaticamente com os tokens. Mas os backgrounds inline com valores hardcoded precisam de ajuste:

- `CTASection.tsx` — background gradient `hsl(142 71% 15%)` → `hsl(160 84% 12%)`
- `HeroSection.tsx` — já usa variáveis, funciona automaticamente
- `SolutionSection.tsx` — já usa variáveis
- `LandingNavbar.tsx` — já usa variáveis

---

### 4. Componentes Internos com Cores Hardcoded

- `BottomTabBar.tsx` — FAB gradient usa `var(--gradient-brand)` ✅, mas o glow tem `hsl(220 85% 58%)` hardcoded → trocar para `hsl(var(--primary))`
- `src/components/finance/FinanceBottomNav.tsx` — verificar se tem hardcoded
- `src/lib/unitThemes.ts` — DEFAULT_THEME primary `220 85%` → `160 84% 39%`, neonCyan `262 70%` → `172 66% 50%`

---

### 5. Logo — Trocar para `logo.png`

O arquivo `src/assets/logo.png` é o logo original do Garden. Trocar todos os imports de `atlas-icon.png` → `logo.png` nos 7 arquivos identificados.

---

### 6. PWA / Favicon

- `index.html` — já tem "Garden" em alguns campos, padronizar tudo
- `public/pwa-192x192.png` e `public/pwa-512x512.png` — idealmente regerar com o logo do Garden (pode ser feito depois)
- `meta theme-color` → trocar `#0c1120` para algo que combine com emerald dark: `#0a1a15`

---

### Arquivos Editados (Total: ~15 arquivos)

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Paleta emerald+teal (tokens dark + light) |
| `src/lib/unitThemes.ts` | DEFAULT_THEME + labels |
| `index.html` | Nome, theme-color |
| `src/pages/Auth.tsx` | Logo + nome |
| `src/components/PageLoader.tsx` | Logo |
| `src/components/layout/AppLayout.tsx` | Logo |
| `src/pages/Invite.tsx` | Logo |
| `src/pages/GamificationPlay.tsx` | Logo |
| `src/components/landing/LandingNavbar.tsx` | Logo + nome |
| `src/components/landing/FooterSection.tsx` | Logo + nome + textos |
| `src/components/landing/HeroSection.tsx` | Texto + gradient fix |
| `src/components/landing/CTASection.tsx` | Gradient hardcoded |
| `src/components/landing/FAQSection.tsx` | Texto |
| `src/components/settings/TeamManagement.tsx` | Texto convite |
| `src/components/layout/BottomTabBar.tsx` | Glow hardcoded → variável |

### Resultado
- Marca "Garden Gestão" consistente em todo o sistema
- Paleta Emerald + Teal premium e sofisticada
- Logo original do Garden em todos os pontos de contato
- Ambos os temas (dark e light) equilibrados e harmônicos
- Sem quebra de componentes — tudo via variáveis CSS

