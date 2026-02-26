

## Plano: Bottom Bar Premium — Acabamento Perfeito

### Problemas atuais (baseado na análise do código e sessão)

1. **Glass-border com `::before` pseudo-element** cria um efeito "borda dupla" que parece desalinhado — o `mask-composite` nem sempre renderiza bem em mobile
2. **Pill highlight** tem bordas quadradas demais (`rounded-2xl` = 16px) e o fundo com opacity 12% é quase invisível — não dá feedback visual claro
3. **FAB central** flutua com `-top-4` mas não tem "encaixe" visual na barra — parece colado, sem conexão orgânica
4. **Ícones Material Symbols** sem fill no ativo — parecem todos iguais, sem distinção clara entre ativo/inativo
5. **Sombra da barra** (`--shadow-floating`) é genérica — precisa de uma sombra mais dramática e difusa para realmente "flutuar"
6. **FinanceBottomNav** usa cálculo percentual para pill que desalinha — precisa do mesmo sistema ref-based

---

### Redesign completo

#### 1. `BottomTabBar.tsx` — Acabamento tier-1

**Barra externa:**
- Trocar `glass-border` (pseudo-element problemático) por borda inline simples: `border: 1px solid hsl(var(--border) / 0.08)`
- Sombra custom mais dramática: `0 -4px 32px hsl(0 0% 0% / 0.2), 0 -1px 8px hsl(0 0% 0% / 0.1)` (sombra para cima, como se flutuasse)
- Fundo com mais opacidade: `hsl(var(--card) / 0.85)` para legibilidade

**Pill highlight:**
- `rounded-[14px]` (mais suave que `rounded-2xl`)
- Fundo mais visível: `hsl(var(--primary) / 0.15)` com borda `hsl(var(--primary) / 0.25)`
- Adicionar `will-change: left, width` para transição GPU-accelerated
- Altura proporcional: `40px` em vez de `44px` para não encostar nas bordas

**Ícones ativos vs inativos:**
- Ativo: `fill={1}` (ícone preenchido) + `text-primary` + scale 1.05 (sutil)
- Inativo: `fill={0}` (outline) + `text-muted-foreground` + sem scale
- Isso cria distinção imediata sem precisar de cores gritantes

**FAB central:**
- Adicionar "notch" visual: sombra interna na barra onde o FAB se encaixa (via CSS `radial-gradient` no fundo)
- `rounded-[18px]` (squircle mais pronunciado)
- Sombra mais difusa: `0 6px 24px hsl(var(--primary) / 0.4)`
- `w-[52px] h-[52px]` (levemente maior para presença)

**Label "Mais":**
- Usar ícone `Grid2x2` em vez de `Menu` — mais moderno e reconhecível como "mais opções"

#### 2. `FinanceBottomNav.tsx` — Ref-based pill + mesmo polish

- Implementar o mesmo sistema de `useRef` + `getBoundingClientRect` da barra global
- Trocar o cálculo percentual `left: calc(...)` por posicionamento pixel-perfect
- Aplicar os mesmos acabamentos: borda inline, sombra dramática, ícones fill/outline

#### 3. `index.css` — Animações e utilitários refinados

- `.nav-highlight-pill`: adicionar `will-change: left` e transição com `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring bounce sutil)
- `.nav-icon-active`: scale `1.05` em vez de `1.1` (mais sutil)
- `.glass-border`: simplificar para borda inline sem pseudo-element (o `::before` com mask causa artefatos)
- Novo `.nav-bar-floating`: classe dedicada com a sombra dramática e fundo otimizado
- Light mode: sombra adaptada com `hsl(220 25% 10% / 0.08)` em vez de preto puro

---

### Arquivos a editar

1. **`src/components/layout/BottomTabBar.tsx`** — pill refinada, ícones fill/outline, FAB squircle maior, borda simplificada
2. **`src/components/finance/FinanceBottomNav.tsx`** — ref-based pill, mesmos acabamentos visuais
3. **`src/index.css`** — `.nav-bar-floating`, `.nav-highlight-pill` spring, `.nav-icon-active` sutil, simplificar `.glass-border`

### Visual esperado

```text
                    ╭─── FAB ───╮
          ╭─────────┤   [  +  ] ├─────────╮
          │  🏠      ╰───────────╯    📦   ⊞ │
          │ Início  ✅ Check            Est  Mais│
          ╰───────────────────────────────────╯
              ↑ pill com fundo primary/15
              ↑ ícone ativo = preenchido (fill)
              ↑ sombra flutuante dramática
```

### Resultado
Barra inferior com acabamento premium: pill com spring animation, ícones que mudam de outline para fill ao ativar, FAB com presença visual integrada, e sombra que faz a ilha realmente flutuar. Padrão visual consistente entre a barra global e a do financeiro.

