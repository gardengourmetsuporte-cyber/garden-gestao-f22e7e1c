
## Corrigir alinhamento da barra inferior do modulo financeiro

### Problema
A barra inferior tem 5 abas + FAB central, mas esta dividida 2 a esquerda e 3 a direita, causando desalinhamento visual.

### Solucao
Remover "Planejar" da barra inferior e mover o acesso para a tela inicial (Home) do modulo financeiro, como um card/botao de acesso rapido. Assim a barra fica com 4 abas + FAB (2 esquerda, 2 direita), perfeitamente simetrica:

```text
[Principal] [Transacoes]  (+)  [Graficos] [Mais]
```

### Alteracoes

**1. `src/components/finance/FinanceBottomNav.tsx`**
- Remover a aba "Planejar" (planning/Target) do array `tabs`
- Resultado: 4 abas divididas 2+2 com FAB ao centro

**2. `src/components/finance/FinanceHome.tsx`**
- Adicionar um card de acesso ao "Planejar" na tela inicial do financeiro (abaixo das pendencias ou receitas/despesas)
- Card com icone Target, titulo "Planejar", subtitulo "Orcamentos, DRE e Fluxo de Caixa"
- Ao clicar, navega para a aba planning via `onNavigate('planning')`

**3. `src/types/finance.ts`**
- Nenhuma alteracao necessaria, o tipo `FinanceTab` ja inclui `'planning'`

### Resultado
- Barra inferior simetrica e alinhada
- Acesso ao Planejar continua disponivel pela Home do financeiro
- Nenhuma funcionalidade perdida
