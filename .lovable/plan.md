

# Redesign completo: WhatsApp Module + Copilot Layout

Dois módulos precisam ser refeitos nesta implementação: o **WhatsApp** (aprovado anteriormente) e o **Copilot** (layout bugado cobrindo a bottom bar).

---

## 1. Copilot — Corrigir layout e modernizar

**Problema**: Usa `fixed inset-0 z-[100]` (linha 171), cobrindo a bottom bar completamente.

**Solução**: Trocar para `<AppLayout>` e ajustar o conteúdo para funcionar dentro do layout padrão.

### Arquivo: `src/pages/Copilot.tsx` — Reescrita

- Remover `fixed inset-0 z-[100]` e o header customizado
- Envolver tudo em `<AppLayout>`
- Estrutura: `flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen`
- Toolbar sticky com avatar do mascote, botões "Nova conversa", "Histórico" e "Limpar"
- Área de mensagens com scroll (`flex-1 overflow-y-auto`)
- Input bar sticky na base com `pb-20` para não ficar atrás da bottom bar mobile
- Manter toda a lógica funcional (useManagementAI, BriefingCard, chips, upload de imagem, histórico Sheet)
- Visual modernizado: bubbles com `bg-card` e borda esquerda primary para assistente, `bg-primary` para usuário

---

## 2. WhatsApp — Separar em sub-rotas com Hub

**Problema**: 5 seções em uma página só com tabs internas, layout fora do padrão.

### Estrutura de rotas

| Rota | Página | Conteúdo |
|---|---|---|
| `/whatsapp` | Hub/Dashboard | Status de conexão + grid de cards |
| `/whatsapp/chats` | Conversas | Lista + chat (lógica atual) |
| `/whatsapp/orders` | Pedidos | Componente WhatsAppOrders |
| `/whatsapp/knowledge` | Base | Componente WhatsAppKnowledge |
| `/whatsapp/logs` | Logs IA | Componente WhatsAppLogs |
| `/whatsapp/settings` | Config | Wizard simplificado de conexão |

### Arquivos

**`src/App.tsx`** — Adicionar 5 novas rotas lazy-loaded:
```
/whatsapp/chats, /whatsapp/orders, /whatsapp/knowledge, /whatsapp/logs, /whatsapp/settings
```

**`src/pages/WhatsApp.tsx`** — Reescrever como Hub:
- `<AppLayout>` com grid de cards navegáveis
- Card grande de status de conexão (usa `useWhatsAppChannels` para verificar se tem canal ativo)
- Grid 2x2: Conversas, Pedidos, Base, Logs
- Card full-width: Configurações
- Contadores (conversas ativas, pedidos draft)

**Criar 5 novas páginas wrapper** (simples, cada uma usa `<AppLayout>` + componente existente + botão voltar):
- `src/pages/WhatsAppChats.tsx` — Lógica de conversas extraída do WhatsApp.tsx atual
- `src/pages/WhatsAppOrders.tsx` — Wrapper para `<WhatsAppOrders />`
- `src/pages/WhatsAppKnowledge.tsx` — Wrapper para `<WhatsAppKnowledge />`
- `src/pages/WhatsAppLogs.tsx` — Wrapper para `<WhatsAppLogs />`
- `src/pages/WhatsAppSettings.tsx` — Redesign do settings como wizard

**`src/pages/WhatsAppSettings.tsx`** — Wizard de conexão:
- Cards visuais para cada provedor com badge "Recomendado" na Evolution API
- Formulário simplificado em etapas (escolher provedor → preencher dados → testar)
- Seção separada para personalidade IA e mensagem fallback
- Botão de teste de conexão proeminente

### Componentes existentes
Os componentes em `src/components/whatsapp/` são mantidos sem alteração — apenas chamados pelas novas páginas wrapper.

---

## Resumo de arquivos

| Ação | Arquivo |
|---|---|
| Reescrever | `src/pages/Copilot.tsx` |
| Reescrever | `src/pages/WhatsApp.tsx` (Hub) |
| Criar | `src/pages/WhatsAppChats.tsx` |
| Criar | `src/pages/WhatsAppOrders.tsx` (wrapper) |
| Criar | `src/pages/WhatsAppKnowledge.tsx` (wrapper) |
| Criar | `src/pages/WhatsAppLogs.tsx` (wrapper) |
| Criar | `src/pages/WhatsAppSettings.tsx` |
| Editar | `src/App.tsx` (adicionar rotas) |

