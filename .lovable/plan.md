

## Relatório Semanal: Receita vs Despesa

Adicionar um novo tipo de visualização **"Semanal"** na aba de gráficos do financeiro, mostrando receitas e despesas lado a lado por semana dentro do mês selecionado.

### O que muda

**Arquivo: `src/components/finance/FinanceCharts.tsx`**

1. Adicionar `'weekly'` como nova opção no seletor de tipo de visualização (ao lado de Categorias, Linha, Barras)
2. O novo gráfico será um **BarChart agrupado** (grouped bars) com barras verdes (receita) e vermelhas (despesa) lado a lado para cada semana
3. A lógica agrupa as transações pagas do mês em semanas (Sem 1, Sem 2, Sem 3, Sem 4, Sem 5) baseado no dia
4. Abaixo do gráfico, cards de resumo por semana mostrando: receita, despesa e saldo da semana
5. O toggle Despesas/Receitas fica **escondido** nessa view (pois mostra ambos juntos)

### Detalhes do gráfico

- Tipo: `BarChart` vertical com 2 barras por semana (receita + despesa)
- Eixo X: Semanas (Sem 1, Sem 2, etc.)
- Eixo Y: Valores
- Cores: verde `#22c55e` para receita, vermelho `#ef4444` para despesa
- Tooltip customizado mostrando receita e despesa da semana
- Cards abaixo com saldo semanal (receita - despesa) e indicador visual positivo/negativo
- Totais do mês no rodapé

### Dados

Usa `dailyExpenses` e `dailyIncome` já disponíveis como props, agrupando por semana (dias 1-7, 8-14, 15-21, 22-28, 29+).

