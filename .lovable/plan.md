

# Corrigir Gráficos do Dashboard de Equipe

## Problemas Identificados
1. **Nomes duplicados** no gráfico "Aproveitamento por membro" — usa apenas o primeiro nome (`split(' ')[0]`), causando "Ana" aparecer 2x
2. **Barras com 0%** mostram cor cinza/destructive — visualmente confuso
3. **Tooltip mostra "pct"** como label técnico em vez de algo legível
4. **Altura fixa de 200px** não se adapta ao número de membros — com 4 membros fica espaçado demais

## Correções

### TeamUtilizationChart.tsx
- Desduplicar nomes: se houver nomes repetidos, adicionar inicial do sobrenome (ex: "Ana S.", "Ana M.")
- Altura dinâmica baseada no número de membros (`members.length * 32 + 20`)
- Barras com 0% usar cor muted em vez de destructive
- Tooltip: label "Aproveitamento" em vez de "pct"
- Adicionar `name` no Tooltip para exibir nome completo

### TeamTrendChart.tsx
- Sem problemas graves, mas ajustar label do tooltip para "Rendimento" e garantir formatação consistente

### useTeamDashboard.ts
- Sem mudanças necessárias — os dados estão corretos, o problema é apenas na visualização

