

## Plano: Espaçamento Padronizado + Bottom Bar Premium

### Problemas identificados

1. **Cards grudados**: O dashboard usa `gap-3` (12px) no grid — muito apertado. A referência Mobills usa ~16-20px entre seções e cards distintos.
2. **Bottom bar — labels ausentes nos inativos**: Apenas o tab ativo mostra label, os inativos ficam só com ícone sem nome, dificultando a navegação.
3. **Highlight pill desalinhada**: O cálculo `left: calc(...)` usa divisão por `slotCount` que nem sempre alinha corretamente com o centro real do botão flex, causando desalinhamento visual.

---

### 1. Espaçamento padronizado no Dashboard (Mobills-style)

**`AdminDashboard.tsx`** e **`EmployeeDashboard.tsx`**:
- Aumentar `gap-3` → `gap-4` (16px) no grid principal
- Adicionar `space-y-6` entre seções distintas (finanças, calendário, checklist, ranking) em vez de empilhar tudo no mesmo grid
- Separar os widgets em grupos lógicos com `space-y-5` entre eles, similar à estrutura Mobills que agrupa "Pendências", "Contas", "Cartões" em blocos separados

**`index.css`**:
- Padronizar `.section-gap` como classe utilitária: `margin-top: 1.25rem` para seções dentro de páginas

### 2. Bottom Tab Bar — Labels sempre visíveis + pill corrigida

**`BottomTabBar.tsx`**:
- **Labels sempre visíveis**: Mostrar o label (`text-[10px]`) em TODOS os tabs, não apenas no ativo. O ativo terá `font-bold text-primary`, inativos terão `font-normal text-muted-foreground`
- **Pill alinhada**: Remover o cálculo percentual manual e usar uma abordagem com `refs` + `getBoundingClientRect` ou simplesmente medir pelo index real dos elementos. Alternativa mais simples: usar CSS `justify-evenly` e calcular a posição baseada em largura fixa dos slots
- **Altura da barra**: Aumentar de `h-[60px]` → `h-[64px]` para acomodar ícone + label com mais respiração
- **Tab "Mais"**: Adicionar label "Mais" abaixo do ícone (consistência)
- **FAB**: Ajustar `-top-5` para compensar a altura extra

**`FinanceBottomNav.tsx`**: Aplicar as mesmas correções (labels sempre visíveis, pill alinhada, altura 64px).

### 3. CSS — Animação e polish da pill

**`index.css`**:
- `.nav-highlight-pill` já tem transição suave — manter
- Adicionar `will-change: left` para performance

---

### Arquivos a editar

1. **`src/components/layout/BottomTabBar.tsx`** — labels sempre visíveis, pill position fix, altura 64px, label no "Mais"
2. **`src/components/finance/FinanceBottomNav.tsx`** — mesmas correções de labels e pill
3. **`src/components/dashboard/AdminDashboard.tsx`** — gap e espaçamento entre seções
4. **`src/index.css`** — classe utilitária de espaçamento se necessário

### Resultado esperado

- Cards com espaço visual entre si como no Mobills (respiração entre seções)
- Bottom bar com todos os nomes visíveis (Principal, Checklists, Estoque, Mais)
- Pill de seleção centralizada corretamente no tab ativo

