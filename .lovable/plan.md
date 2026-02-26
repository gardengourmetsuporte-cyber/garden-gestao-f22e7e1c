

## Problema
Os botões de Receita, Despesa e Transferência no menu FAB do financeiro estão com aparência opaca. O fundo `card-glass` (60% de opacidade + blur) sobre o overlay escuro dilui visualmente as cores dos ícones.

## Solução
Tornar os containers dos ícones mais opacos e dar mais destaque às cores, além de aumentar o `fill` dos ícones para ficarem preenchidos (sólidos) em vez de contornados.

## Alterações

### `src/components/finance/FinanceBottomNav.tsx`
1. Trocar o fundo dos 3 botões de `card-glass` para um fundo sólido com leve tint da cor correspondente:
   - Receita: `bg-[hsl(var(--color-income)/0.15)]` com borda `border border-[hsl(var(--color-income)/0.3)]`
   - Despesa: `bg-[hsl(var(--color-expense)/0.15)]` com borda `border border-[hsl(var(--color-expense)/0.3)]`
   - Transferência: `bg-[hsl(var(--color-transfer)/0.15)]` com borda `border border-[hsl(var(--color-transfer)/0.3)]`
2. Adicionar `fill={1}` nos `AppIcon` para que fiquem preenchidos e visualmente mais vibrantes
3. Manter o `boxShadow` glow existente para cada cor

