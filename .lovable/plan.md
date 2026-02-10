
# Ajustes no Financeiro + FAB Neon + Icones do Sistema

## O que muda

### 1. Remover botoes de acao do painel principal (FinanceHome)
- Remover a secao inteira de "Quick Actions" (botoes Receita, Despesa, Transf.) -- linhas 94-132
- Remover o botao "Nova" conta do header da lista de contas -- linha 138
- Manter toda a logica; apenas o JSX visual e removido
- Remover props `onAddTransaction` e `onAddAccount` do componente (e de Finance.tsx)

### 2. FAB do BottomNav com menu radial neon
- Ao clicar no +, em vez de abrir direto como despesa, exibir um menu com 3 opcoes: Receita, Despesa, Transferencia
- O menu aparece como popup acima do FAB com os 3 botoes circulares neon (verde, vermelho, azul) -- estilo da foto de referencia
- Animacao de "fan out" ao abrir (escala + opacidade)
- Overlay escuro ao abrir o menu
- Substituir o blur/glow do FAB atual por uma borda neon animada com gradiente rotativo (conic-gradient animado), similar ao card principal da referencia
- O + tera borda fina neon (cyan/azul) com glow sutil pulsante, sem blur pesado

### 3. Icones maiores em todo o sistema
- Sidebar: aumentar icones de w-[22px] h-[22px] para w-6 h-6
- Header mobile: icones de w-5 para w-[22px]
- Bottom nav financeiro: icones de w-5 h-5 para w-6 h-6
- FAB: icone + de w-7 h-7 para w-8 h-8

### 4. Animacao neon do FAB (CSS)
- Adicionar keyframe `neonRotate` para gradiente conic rotativo na borda do FAB
- Pseudo-elemento ::before com conic-gradient animado para efeito de borda neon dinamica
- Glow externo sutil pulsante

## Detalhes Tecnicos

### Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/components/finance/FinanceHome.tsx` | Remover secao Quick Actions e botao Nova conta |
| `src/components/finance/FinanceBottomNav.tsx` | Menu radial neon no FAB + icones maiores |
| `src/pages/Finance.tsx` | Passar `onAddTransaction` para BottomNav em vez de FinanceHome |
| `src/components/layout/AppLayout.tsx` | Icones maiores na sidebar e header |
| `src/index.css` | Adicionar animacao neonRotate e classe .fab-neon |

### Fluxo do FAB
```text
Toca no + (FAB)
  |
  +-- Overlay escuro aparece
  +-- 3 botoes circulares surgem acima do FAB (fan-out animation)
  |     [Receita (verde)]  [Despesa (vermelho)]  [Transf. (cyan)]
  |
  +-- Toca em um dos botoes -> abre TransactionSheet com o tipo correto
  +-- Toca no overlay ou no X -> fecha o menu
```

### Estilo do FAB neon
- Fundo escuro solido (bg-card) em vez de gradiente
- Borda com conic-gradient rotativo (cyan -> purple -> blue -> cyan)
- Glow externo com box-shadow pulsante
- Icone + em cor cyan
