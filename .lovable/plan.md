

## Plano: Visão Anual Comparativa nos Gráficos Financeiros

### Objetivo
Adicionar uma nova aba **"Anual"** no seletor de visualizações dos gráficos financeiros, que exibe o panorama completo do ano com comparativos mês a mês.

### O que será construído

**1. Hook `useAnnualFinanceStats`** — busca dados agregados dos 12 meses do ano selecionado em uma única query.
- Retorna: receita, despesa e saldo por mês + totais anuais + top categorias do ano + variação mês a mês (%).

**2. Componente `AnnualFinanceView`** — tela completa com múltiplas seções:

```text
┌──────────────────────────────────┐
│  Cards resumo do ano (3 cols)    │
│  Receita │ Despesa │ Resultado   │
├──────────────────────────────────┤
│  Bar Chart comparativo 12 meses │
│  (barras lado a lado: receita   │
│   vs despesa + linha de saldo)  │
├──────────────────────────────────┤
│  Heatmap / Mini-barras por mês  │
│  (grade 4x3 com intensidade de  │
│   cor proporcional ao valor)    │
├──────────────────────────────────┤
│  Evolução do saldo (area chart) │
│  acumulado mês a mês            │
├──────────────────────────────────┤
│  Top 5 categorias do ano        │
│  (horizontal bar chart)         │
├──────────────────────────────────┤
│  Tabela resumo mensal           │
│  (mês | receita | despesa |     │
│   saldo | variação%)            │
└──────────────────────────────────┘
```

**Seções detalhadas:**

- **Cards de resumo**: 3 glass cards com totais anuais (receita, despesa, resultado) com indicador de tendência
- **Bar Chart 12 meses**: Barras agrupadas (verde receita / vermelho despesa) com linha sobreposta do saldo (ComposedChart do Recharts)
- **Heatmap mensal**: Grade 4x3 (Jan-Dez) com cor proporcional ao gasto — toque abre detalhes do mês
- **Evolução do saldo**: AreaChart mostrando acumulado de receita vs despesa ao longo do ano
- **Top categorias anuais**: Barras horizontais com as 5 maiores categorias de despesa do ano
- **Tabela resumo**: Lista scrollável com cada mês, valores e variação % vs mês anterior (seta verde/vermelha)

**3. Integração no `FinanceCharts`**:
- Novo item `'annual'` no toggle de visualizações com label "Anual"
- Quando selecionado, esconde o seletor de mês (usa apenas o ano do `selectedMonth`)
- Navegação de ano via setas (< 2025 | 2026 >)

**4. Navegação ano**: Componente simples com setas para trocar o ano, reaproveitando o estilo do `UnifiedMonthNav`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useAnnualFinanceStats.ts` | Criar — query dos 12 meses |
| `src/components/finance/AnnualFinanceView.tsx` | Criar — todas as visualizações anuais |
| `src/components/finance/FinanceCharts.tsx` | Editar — adicionar tab "Anual" e renderizar o novo componente |

### Estética
- Segue o design system "Premium Dark Glass" existente
- Cards com `card-base` / `card-surface`
- Gradientes nos gráficos consistentes com os já usados (verde/vermelho)
- Tooltips com backdrop-blur
- Responsivo: no mobile os gráficos scrollam horizontalmente quando necessário

