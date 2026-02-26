

## Rebranding Completo de Cores — Paleta Emerald/Teal Escura + Logo com Fundo Branco

### Problema
O verde atual (`160 84% 39%`) ficou claro demais e "descolado" do resto do sistema. Há dezenas de cores hardcoded (azuis `220`, roxos `262`, etc.) que não foram migradas e criam uma paleta incoerente. Os cards com gradiente (finance-hero) ainda usam tons azul/roxo que não conversam com a nova identidade.

### Direção Visual
Paleta **Emerald escuro + Teal profundo** — mais saturada e mais escura que a atual, inspirada em Mercury/Wise. Tom premium, não "verde limão".

### Paleta Proposta (Dark)

```text
Token               Antes                   Agora
──────────────────────────────────────────────────────
--primary           160 84% 39% (claro)     158 64% 32% (emerald escuro)
--accent            172 66% 50% (teal)      170 55% 40% (teal profundo)
--ring              160 84% 39%             158 64% 32%
--neon-cyan          172 66% 50%            170 55% 45%
--neon-purple        160 50% 60%            168 45% 50% (teal médio)
```

### Paleta Proposta (Light)

```text
--primary           160 70% 36%             158 55% 30%
--accent            172 55% 45%             170 45% 38%
--ring              160 70% 36%             158 55% 30%
```

### Mudanças Detalhadas

**1. `src/index.css` — Tokens base + Hardcoded colors (~30 linhas)**
- Atualizar todos os tokens `--primary`, `--accent`, `--ring` nos dois temas
- Atualizar `--neon-cyan`, `--neon-purple` em `:root`
- Atualizar todos os `--glow-*`, `--gradient-brand`, `--shadow-glow`
- **finance-hero-card**: trocar gradiente de `hsl(220 70% 18%)` / `hsl(260 45% 18%)` para tons emerald escuros: `hsl(158 40% 12%)` / `hsl(168 35% 10%)` / `hsl(150 30% 14%)`
- **finance-hero-card--personal**: ajustar para manter harmonia
- **action-button-primary**: `box-shadow` hardcoded `hsl(217 91%)` → `hsl(var(--primary))`
- **.fab**: `box-shadow` hardcoded `hsl(217 91%)` → `hsl(var(--primary))`
- **.nav-bar-neon-glow**: trocar `hsl(262 80% 55%)` → `hsl(var(--accent))`
- **finance-hero-chip--success**: border `hsl(142 71% 45%)` → `hsl(var(--success))`

**2. `src/lib/unitThemes.ts` — DEFAULT_THEME**
- Atualizar primary/neonCyan/ring/glows para novos valores

**3. `src/pages/TabletMenu.tsx` — 1 linha**
- `boxShadow: 'hsl(217 91% 60%)'` → `hsl(var(--primary))`

**4. `src/components/finance/FinanceBottomNav.tsx` — FAB personal**
- Trocar `hsl(160 60% 45%)` hardcoded → `hsl(var(--primary))`

**5. `src/components/dashboard/PersonalFinanceChartWidget.tsx` — 4 linhas**
- Trocar `hsl(160 60% 40%)` e `hsl(160 60% 30%)` → `hsl(var(--primary))`

**6. `src/pages/Checklists.tsx` — Trocar `hsl(262 80% 65%)` (roxo)**
- Substituir por `hsl(var(--accent))` para manter na paleta

**7. `src/index.css` — `.fab-neon-border-personal`**
- Trocar hardcoded `hsl(160 60% 45%)`, `hsl(140 50% 35%)`, `hsl(170 55% 40%)` → usar tokens CSS

**8. Logo com fundo branco**
- O logo `src/assets/logo.png` já é o logo original. Se o usuário quer "com fundo branco", basta adicionar uma classe `bg-white rounded-full p-1` nos locais onde o logo aparece sobre fundo escuro (Auth, PageLoader, AppLayout, etc.) — garantindo contraste.

### Arquivos Editados (~8 arquivos)

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Paleta completa + todos os hardcoded |
| `src/lib/unitThemes.ts` | DEFAULT_THEME atualizado |
| `src/pages/TabletMenu.tsx` | 1 box-shadow |
| `src/components/finance/FinanceBottomNav.tsx` | FAB colors |
| `src/components/dashboard/PersonalFinanceChartWidget.tsx` | 4 linhas hardcoded |
| `src/pages/Checklists.tsx` | Roxo → accent |
| `src/pages/Auth.tsx` | Logo com bg-white rounded |
| `src/components/PageLoader.tsx` | Logo com bg-white rounded |
| `src/components/layout/AppLayout.tsx` | Logo com bg-white rounded |

### Resultado
- Paleta Emerald/Teal **escura e sofisticada** — sem verde claro
- Finance hero cards com gradiente emerald escuro que conversa com o tema
- Zero cores hardcoded fora da paleta
- Logo com fundo branco para contraste em superfícies escuras
- Ambos os temas (dark/light) harmônicos e equilibrados

