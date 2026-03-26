

# Melhorar Visualização de Previsões nos Headers Diários

## Problemas atuais
1. Dias futuros sem despesas não aparecem na lista (só aparecem dias com transações reais)
2. A visualização da previsão está confusa - mistura dados reais com previstos sem separação clara

## Solução

### 1. Injetar dias futuros sem transações na lista
No `FinanceTransactions.tsx`, quando `showForecast` está ativo, adicionar ao `sortedDates` todos os dias futuros do mês que têm forecast mas não têm transações. Assim o usuário vê **todos os dias restantes** com suas previsões.

### 2. Redesenhar o header do dia com previsão
Quando o modo previsão está ativo, o header de cada dia futuro mostrará de forma clara e separada:

```text
QUINTA-FEIRA, 27 DE MARÇO
  Gastos: -R$ 6.339    |    Prev. entrada: +R$ 1.400    |    Saldo prev: R$ 11.000
```

- **Linha 1**: Data (como já é)
- **Linha 2**: Card compacto abaixo do nome do dia com 3 informações:
  - Gasto real do dia (vermelho) - soma das transações existentes
  - Previsão de entrada (verde) - baseado na média do dia da semana
  - Saldo projetado acumulado (azul/verde ou vermelho se negativo)

Para dias sem transações, mostra apenas as previsões num card estilizado com fundo sutil.

### Arquivos a editar

1. **`src/components/finance/FinanceTransactions.tsx`**
   - Criar lista `allDates` que mescla `sortedDates` com dias futuros do forecast quando `showForecast` ativo
   - Redesenhar o badge de forecast para layout em linha clara abaixo do header
   - Para dias sem transações, renderizar apenas o header com previsão (sem lista de itens)

2. **`src/hooks/useSalesForecast.ts`**
   - Sem alterações necessárias - já gera forecasts para todos os dias futuros

