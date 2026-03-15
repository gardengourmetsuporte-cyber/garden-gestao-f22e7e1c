
# Trocar ícone do botão de envio do Copilot Widget

O ícone `ArrowUp` no botão de envio está renderizando feio com Material Symbols nesse contexto escuro/pequeno.

## Mudança

**Arquivo:** `src/components/dashboard/AICopilotWidget.tsx`

- Trocar `ArrowUp` por `Send` (que já é usado na página do Copilot e renderiza bem como ícone de envio)
- Linha 88: `<AppIcon name="Send" size={16} className="text-white" />`

Mudança simples de uma linha.
