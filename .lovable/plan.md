
# Ajuste automático de viewport no widget do Copiloto

## Problema
Quando o widget expande ou recebe novas mensagens, a página não ajusta a posição e as mensagens ficam fora da área visível. O `scrollIntoView` com `block: 'nearest'` não garante que o widget inteiro (incluindo o input) fique visível.

## Solução

**Arquivo:** `src/components/dashboard/AICopilotWidget.tsx`

1. **Trocar `block: 'nearest'` por `block: 'end'`** no `scrollIntoView` ao expandir — isso garante que o final do widget (onde está o input) fique visível
2. **Adicionar scroll automático após envio de mensagem** — após cada `sendMessage`, fazer scroll do widget para manter visível
3. **Adicionar scroll ao receber resposta** — no useEffect de messages, além de scroll interno, garantir que o widget esteja na viewport
4. **Usar `setTimeout` com delay adequado** para aguardar a renderização antes de ajustar

Mudanças específicas:
- No useEffect de expand: `widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })`
- No useEffect de messages: adicionar `widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })` após o scroll interno
- No `handleSubmit` e `handleSuggestion`: agendar scroll após envio
