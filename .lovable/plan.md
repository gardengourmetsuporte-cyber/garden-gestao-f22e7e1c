
# Diferenciar Visual do Financeiro Pessoal

## Objetivo
Mudar a identidade visual do modulo Financeiro Pessoal para que fique claro que voce nao esta no financeiro do Garden. A ideia e trocar o gradiente azul/roxo do hero card por um **verde-esmeralda/teal** e ajustar a cor de destaque da bottom nav.

## Mudancas

### 1. Novo hero card pessoal (`src/index.css`)
Adicionar classes CSS exclusivas para o financeiro pessoal:
- `.finance-hero-card--personal` com gradiente **verde-esmeralda para teal escuro** (em vez de azul/roxo/rosa)
- Sombras e glows em tons de verde/teal
- Manter a mesma estrutura, so trocar a paleta

Cores do gradiente pessoal:
```
135deg:
  hsl(160 60% 22%) 0%       (verde escuro)
  hsl(170 50% 18%) 30%      (teal profundo)  
  hsl(150 45% 25%) 70%      (esmeralda)
  hsl(140 40% 20%) 100%     (verde floresta)
```

### 2. FinanceHome aceitar prop de tema (`src/components/finance/FinanceHome.tsx`)
- Adicionar prop opcional `variant?: 'business' | 'personal'`
- Quando `personal`, usar a classe `.finance-hero-card--personal` no hero card
- Trocar o label "Saldo em contas" por "Meu saldo pessoal"

### 3. FinanceBottomNav aceitar prop de tema (`src/components/finance/FinanceBottomNav.tsx`)
- Adicionar prop opcional `variant?: 'business' | 'personal'`
- Quando `personal`, trocar a cor neon-cyan do FAB e indicadores para **neon-green/emerald**

### 4. PersonalFinance.tsx passar variant
- Passar `variant="personal"` para `FinanceHome` e `FinanceBottomNav`

## Resultado Visual
- **Financeiro Garden**: gradiente azul/roxo, destaques cyan
- **Financeiro Pessoal**: gradiente verde/teal, destaques emerald
- Imediatamente reconhecivel que sao modulos diferentes

## Arquivos Editados
- `src/index.css` -- novas classes CSS do tema pessoal
- `src/components/finance/FinanceHome.tsx` -- prop variant + classe condicional
- `src/components/finance/FinanceBottomNav.tsx` -- prop variant + cores condicionais
- `src/pages/PersonalFinance.tsx` -- passar variant="personal"
