

## Plano de Polimento Visual — Nível Instagram/WhatsApp

Após análise completa do sistema, identifiquei 7 áreas onde micro-refinamentos elevam a experiência para o padrão de apps tier-1. O foco é em **suavidade, consistência e respiração visual** — os detalhes que separam "bom" de "premium".

---

### 1. Inputs mais suaves e modernos

**Problema**: Inputs com `rounded-md` e borda dura — parecem formulário web genérico.
**Solução**: Atualizar `src/components/ui/input.tsx` para `rounded-xl`, altura `h-12`, fundo `bg-secondary/50` sem borda visível (borda só no focus), transição suave de focus com ring mais sutil.

**Arquivo**: `src/components/ui/input.tsx`

---

### 2. Toasts com visual premium

**Problema**: Toasts do Sonner usam estilos padrão — bordas duras, sem personalidade.
**Solução**: Atualizar `src/components/ui/sonner.tsx` com `rounded-2xl`, backdrop-blur, borda sutil com `border-border/30`, shadow elevada. Posicionar `bottom-center` no mobile (padrão WhatsApp/Instagram).

**Arquivo**: `src/components/ui/sonner.tsx`

---

### 3. Header mobile com blur de verdade

**Problema**: Header mobile usa `bg-background` sólido — perde a sofisticação de apps nativos.
**Solução**: Mudar para `bg-background/80 backdrop-blur-xl` no header e remover o glow inferior (poluição visual). Instagram/WhatsApp têm headers limpos com blur sutil.

**Arquivo**: `src/components/layout/AppLayout.tsx` (linhas 160-222)

---

### 4. Bottom Tab Bar simplificada

**Problema**: 3 camadas de neon glow no topo da barra inferior + FAB glow ring — overdesigned vs. Instagram.
**Solução**: Reduzir para 1 linha sutil de separador (1px border-top), remover os 3 layers de glow animado, remover o orb radial atrás do FAB. Manter o FAB gradient mas sem o glow ring externo.

**Arquivo**: `src/components/layout/BottomTabBar.tsx` (linhas 107-128, 154-161)

---

### 5. Sheets/Drawers com cantos mais orgânicos

**Problema**: Drawer handle é `w-[100px]` — grosso demais. Border radius do sheet mobile é `rounded-t-[10px]` — pouco arredondado.
**Solução**: Handle para `w-10 h-1 rounded-full bg-muted-foreground/20`, border radius para `rounded-t-3xl`. Padding interno mais generoso.

**Arquivo**: `src/components/ui/sheet.tsx` (linhas 132-141)

---

### 6. Cards com bordas mais sutis

**Problema**: Cards usam `border: 1px solid hsl(var(--border) / 0.4)` — visível demais no light mode, cria "caixas" demais.
**Solução**: No light mode, remover bordas dos cards principais (usar apenas shadow). No dark mode, manter borda mas reduzir para `border / 0.15`. Adicionar `hover:shadow-card-hover` mais suave.

**Arquivo**: `src/index.css` (linhas 314-347 — card classes)

---

### 7. Overlay mais suave

**Problema**: Dialog e Sheet overlays usam `bg-black/80` — muito escuro, Instagram usa ~50-60%.
**Solução**: Reduzir overlay para `bg-black/60` com `backdrop-blur-sm` para um efeito mais elegante.

**Arquivos**: `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`

---

### Resumo de arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/ui/input.tsx` | rounded-xl, h-12, bg-secondary/50, focus sutil |
| `src/components/ui/sonner.tsx` | rounded-2xl, blur, bottom-center mobile |
| `src/components/layout/AppLayout.tsx` | Header blur, remover glow inferior |
| `src/components/layout/BottomTabBar.tsx` | Remover 3 neon glows, simplificar FAB |
| `src/components/ui/sheet.tsx` | Handle fino, rounded-t-3xl |
| `src/index.css` | Cards sem borda no light, borda mais sutil no dark |
| `src/components/ui/dialog.tsx` | Overlay 60%, backdrop-blur |

