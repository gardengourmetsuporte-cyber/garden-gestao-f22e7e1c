

## Plano: Redesign Premium — Bottom Bars + Visual Overhaul

### Problema
O layout atual tem uma estética "quadrada" e datada — barras inferiores flat com bordas retas, cards sem profundidade visual suficiente, e a navegação carece de personalidade. Referências como Linear, Mobills e Mercury usam formas orgânicas, glassmorphism real, e micro-interações que fazem a UI "respirar".

### Escopo das mudanças

---

### 1. Bottom Tab Bar Global — Redesign "Floating Island"

Inspiração: iOS Dynamic Island + Nubank bottom bar.

**De:**
```text
┌──────────────────────────────────────┐
│  Home  Checklists  [+]  Estoque  Mais│
└──────────────────────────────────────┘
← barra colada na borda, fundo opaco, visual plano
```

**Para:**
```text
          ╭──────────────────────────╮
          │ Home  Check  [+]  Est  ⋯ │
          ╰──────────────────────────╯
← ilha flutuante com bordas arredondadas (rounded-[28px]),
  margin lateral 16px, bottom 12px, glassmorphism forte,
  borda sutil com gradiente, sombra elevada
```

**Detalhes técnicos:**
- `rounded-[28px]` em vez de borda reta colada ao bottom
- `mx-4 mb-3` para dar margem e "flutuar" acima da safe-area
- Fundo `bg-card/70 backdrop-blur-3xl` com `border: 1px solid hsl(var(--border) / 0.15)`
- Shadow mais elevada: `0 8px 32px hsl(0 0% 0% / 0.25)`
- Pill indicator: agora fica atrás do ícone ativo como um **highlight pill** (fundo arredondado atrás do item, não apenas uma barra de 3px no bottom)
- FAB central: agora usa `rounded-2xl` (squircle) em vez de circle, com gradiente sutil no fundo em vez de borda neon rotating — mais refinado
- Ícones ativos: leve scale(1.1) + tint do primary, sem drop-shadow exagerado
- Labels removidos dos tabs inativos (mostrar apenas no ativo) — visual mais limpo

**Arquivo:** `src/components/layout/BottomTabBar.tsx`, `src/index.css`

---

### 2. Finance Bottom Nav — Mesmo tratamento "Floating Island"

Aplicar o mesmo padrão da barra global ao `FinanceBottomNav`:
- Ilha flutuante com `mx-4 mb-3 rounded-[28px]`
- Glassmorphism + shadow elevada
- FAB central squircle com gradiente ao invés de neon rotating border
- Radial menu (receita/despesa/transferência): cards com glassmorphism em vez de círculos flat

**Arquivo:** `src/components/finance/FinanceBottomNav.tsx`

---

### 3. Cards — Mais profundidade e organicidade

**Refinamentos no CSS:**
- Aumentar `--radius` de `1rem` para `1.25rem` (20px) — cantos mais suaves
- Cards com `shadow-card` mais pronunciada (mais depth)
- `card-interactive` com hover que mostra subtle border gradient
- Adicionar classe `.card-glass` com `bg-card/60 backdrop-blur-2xl` para widgets do dashboard

**Arquivo:** `src/index.css`

---

### 4. Page Headers — Mais respiração

- Remover border-bottom rígido, usar gradiente fade-out
- Adicionar 4px a mais de padding vertical
- Title com `text-2xl` em vez de `text-xl` para mais impacto

**Arquivo:** `src/index.css`

---

### 5. MoreDrawer — Grid de ícones mais premium

- Ícones do grid: `rounded-[18px]` (squircle) em vez de `rounded-2xl`
- Adicionar subtle gradient no fundo do ícone ativo
- Spacing mais generoso entre items

**Arquivo:** `src/components/layout/MoreDrawer.tsx`

---

### 6. QuickActionSheet — Visual mais orgânico

- Botões de ação com `rounded-2xl` e subtle gradient no ícone
- Hover com glow sutil da cor do ícone

**Arquivo:** `src/components/layout/QuickActionSheet.tsx`

---

### 7. Novas animações CSS

- `.nav-highlight-pill`: animação de transição suave do highlight atrás do tab ativo
- Atualizar `.fab-neon-border` para um gradiente mais sutil e menos "gamer"
- Adicionar `.glass-border`: `border-image` com gradiente branco/transparente

**Arquivo:** `src/index.css`

---

### Arquivos a editar

1. **`src/index.css`** — tokens de radius, shadow, card-glass, header, animações
2. **`src/components/layout/BottomTabBar.tsx`** — redesign floating island
3. **`src/components/finance/FinanceBottomNav.tsx`** — mesmo padrão floating
4. **`src/components/layout/MoreDrawer.tsx`** — grid de ícones squircle
5. **`src/components/layout/QuickActionSheet.tsx`** — visual orgânico
6. **`tailwind.config.ts`** — adicionar `backdrop-blur-3xl` se necessário

### Resultado esperado

A navegação inferior vira uma "ilha flutuante" elegante, os cards ganham mais profundidade e cantos orgânicos, e a aparência geral sai do "Windows 2000" para algo que compete com Nubank, Linear e Mobills em polish visual.

