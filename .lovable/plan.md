

## Mudanças no FinanceCharts

### 1. Esconder toggle Despesas/Receitas na view "Linha"
O gráfico de linha já mostra receita e despesa juntos. Esconder o toggle assim como já é feito na view "Semanal".

**Arquivo:** `src/components/finance/FinanceCharts.tsx` (linha 171)
- Alterar condição de `viewType !== 'weekly'` para `viewType !== 'weekly' && viewType !== 'timeline'`

### 2. Substituir "Barras" por "Acumulado"
Trocar o gráfico de barras horizontais por categoria (pouca informação nova vs Categorias) por um **gráfico acumulado** que mostra a evolução do saldo ao longo do mês.

- Renomear tab "Barras" → "Acumulado"
- Calcular receita e despesa acumuladas dia a dia usando `mergedTimelineData`
- Renderizar um `AreaChart` com 2 áreas: receita acumulada (verde) e despesa acumulada (vermelha)
- A distância visual entre as duas linhas mostra o saldo acumulado
- Tooltip mostrando receita acumulada, despesa acumulada e saldo do dia
- Cards abaixo com saldo final do mês
- Esconder toggle nessa view também (mostra ambos)

Esse gráfico é mais informativo porque mostra **quando** o dinheiro entra e sai ao longo do mês, permitindo ver se em algum momento a despesa ultrapassou a receita.

### Resumo das alterações
- **1 arquivo**: `src/components/finance/FinanceCharts.tsx`
- Toggle escondido em Linha e Acumulado
- Seção "bars" substituída por gráfico acumulado

