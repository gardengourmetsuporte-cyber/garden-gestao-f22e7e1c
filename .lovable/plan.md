

# Chat Interativo do Copiloto na Dashboard Operacional

## Conceito

Substituir o widget antigo `AICopilotWidget` por um novo componente moderno inspirado em interfaces de IA contemporâneas (ChatGPT, Perplexity). O chat será integrado diretamente na dashboard operacional com uma transição animada fluida.

### Comportamento

1. **Estado Colapsado (barra de entrada)**: Uma barra de input elegante com fundo gradiente sutil, ícone do copiloto pulsante e placeholder convidativo — estilo "Ask AI". Sugestões rápidas em chips horizontais abaixo.

2. **Transição de Abertura**: Ao clicar ou digitar, a barra se expande suavemente (animação de height + opacity + scale) transformando-se em um painel de chat inline que ocupa o espaço na dashboard, empurrando os widgets abaixo.

3. **Estado Expandido**: Chat completo com mensagens em bolhas assimétricas, renderização markdown, indicador de digitação com shimmer, e header minimalista com botão de fechar que faz a transição reversa.

## Mudanças Técnicas

### 1. Reescrever `AICopilotWidget.tsx`
- Novo design com 2 estados: barra compacta e chat expandido
- Barra compacta: input com gradiente de fundo (`#1a1a2e` → `#0f3460`), ícone com gradiente roxo/rosa pulsante, chips de sugestão
- Chips de sugestão: "Como está meu estoque?", "Resumo do dia", "Despesas pendentes"
- Transição com `max-height`, `opacity` e `transform` via CSS transitions (300ms ease-out)
- Chat expandido: bolhas com markdown (via `CopilotMessageContent`), shimmer loading, scroll automático
- Indicador de typing com shimmer gradient animado (não apenas dots)

### 2. Adicionar CSS de animação em `index.css`
- Keyframe `@keyframes shimmer-typing` para efeito de digitação
- Keyframe `@keyframes copilot-glow` para brilho pulsante no ícone
- Classes de transição para expand/collapse suave

### 3. Integrar no `AdminDashboard.tsx`
- Adicionar o widget na view `operational`, logo após o `QuickStats` e antes dos outros widgets
- Importar o componente reescrito

## Visual

```text
┌─────────────────────────────────────┐
│  ✨  Pergunte ao Copiloto...   [→] │  ← Barra gradiente com glow
├─────────────────────────────────────┤
│ [Como está meu estoque?] [Resumo]  │  ← Chips de sugestão
└─────────────────────────────────────┘

         ↓ ao clicar/digitar ↓

┌─────────────────────────────────────┐
│  🤖 Copiloto IA          Online [X]│  ← Header minimalista
│─────────────────────────────────────│
│  ┌──────────────────────┐           │
│  │ Olá! Aqui está o     │           │  ← Bolha assistente
│  │ resumo do seu dia... │           │
│  └──────────────────────┘           │
│           ┌─────────────────┐       │
│           │ Como está meu   │       │  ← Bolha usuário
│           │ estoque?        │       │
│           └─────────────────┘       │
│  ┌──▒▒▒▒░░░░░░░─────────┐          │  ← Shimmer typing
│─────────────────────────────────────│
│  [  Pergunte algo...          ] [→] │  ← Input
└─────────────────────────────────────┘
```

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/AICopilotWidget.tsx` | Reescrever completamente |
| `src/components/dashboard/AdminDashboard.tsx` | Adicionar widget na view operacional |
| `src/index.css` | Adicionar keyframes shimmer e glow |

