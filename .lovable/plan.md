
# Redesign do Layout do Chat

## Objetivo
Refazer o layout completo do modulo de Chat (Messenger) com um design mais moderno e diferente para testar uma nova abordagem visual.

## Mudancas Propostas

### 1. Lista de Conversas (Chat.tsx)
- Remover a barra de "Stories/Contatos" horizontal do topo
- Header mais limpo e minimalista com titulo e botoes de acao
- Cards de conversa com layout mais espassado, avatar maior (56px) e preview da mensagem com 2 linhas
- Separador sutil entre conversas ao inves de hover/bg
- Badge de nao lidas redesenhado (pill ao lado do horario ao inves de bolinha no avatar)
- Busca com visual "floating" (icone animado, sem borda visivel)

### 2. Janela de Chat (ChatWindow.tsx)
- Header mais alto (h-16) com avatar circular maior e status "online" com bolinha verde
- Area de mensagens com fundo sutil de pattern (usando CSS gradient muito leve)
- Campo de input redesenhado: textarea expansivel (auto-grow ate 4 linhas) ao inves de input single-line, com botao de enviar que aparece apenas quando ha texto (transicao suave)
- Botao de "+" para anexos futuro (placeholder)

### 3. Boloes de Mensagem (ChatMessage.tsx)
- Estilo mais "flat": sem gradientes nos baloes, cores solidas
- Balao do usuario: cor primaria solid com cantos mais arredondados
- Balao do outro: bg-muted sem sombra
- Horario dentro do balao alinhado na parte inferior
- Avatar do remetente menor (28px) e posicionado mais proximo ao balao

### 4. Sidebar Desktop (ChatSidebar.tsx)
- Nao e usado atualmente no fluxo principal (o Chat.tsx tem sua propria lista). Manter como esta.

## Detalhes Tecnicos

**Arquivos modificados:**
- `src/pages/Chat.tsx` -- Remover stories bar, redesenhar lista de conversas
- `src/components/chat/ChatWindow.tsx` -- Novo header, textarea auto-grow, layout de input
- `src/components/chat/ChatMessage.tsx` -- Baloes flat, avatar menor, horario reposicionado

**Sem dependencias novas.** Tudo feito com Tailwind existente.

**Textarea auto-grow:** Usar ref + ajuste de `scrollHeight` no `onChange` para expandir automaticamente ate `max-h-24` (4 linhas).
