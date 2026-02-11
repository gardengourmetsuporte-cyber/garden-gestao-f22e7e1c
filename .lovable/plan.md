
# Chat Interno da Equipe

Sistema de mensagens em tempo real para comunicacao entre funcionarios e envio de comunicados em grupo, integrado ao estilo "Dark Command Center" do sistema.

## Funcionalidades

### Conversas Diretas (1:1)
- Qualquer usuario pode iniciar uma conversa com outro membro da mesma unidade
- Lista de contatos baseada nos perfis vinculados a unidade ativa
- Indicador de mensagens nao lidas

### Canal de Comunicados (Grupo da Unidade)
- Canal automatico por unidade onde admins podem enviar avisos e comunicados
- Todos os membros da unidade podem visualizar
- Admins podem fixar (pin) mensagens importantes
- Funcionarios podem reagir mas nao postar (apenas admins postam comunicados)

### Chat em Grupo Livre
- Admins podem criar grupos personalizados com membros da unidade
- Qualquer membro do grupo pode enviar mensagens

### Interface
- Nova pagina `/chat` acessivel pelo menu lateral (icone MessageCircle)
- Layout dividido: lista de conversas a esquerda, area de mensagens a direita
- No mobile: lista de conversas ocupa tela cheia, ao tocar abre a conversa em tela cheia com botao voltar
- Mensagens com avatar, nome, hora e status de leitura
- Input com suporte a texto e emoji
- Badge de nao lidas no menu lateral (similar ao badge de notificacoes)
- Realtime via Supabase para mensagens instantaneas

---

## Detalhes Tecnicos

### Novas Tabelas no Banco de Dados

**`chat_conversations`** - Representa uma conversa (DM, grupo ou canal)
- `id` (uuid, PK)
- `unit_id` (uuid, FK units) - isolamento por unidade
- `type` (enum: 'direct', 'group', 'announcement') 
- `name` (text, nullable) - nome do grupo/canal
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamptz)

**`chat_participants`** - Membros de cada conversa
- `id` (uuid, PK)
- `conversation_id` (uuid, FK chat_conversations)
- `user_id` (uuid)
- `role` (text: 'member', 'admin') - admin do grupo
- `last_read_at` (timestamptz) - para contagem de nao lidas
- `joined_at` (timestamptz)

**`chat_messages`** - Mensagens
- `id` (uuid, PK)
- `conversation_id` (uuid, FK chat_conversations)
- `sender_id` (uuid)
- `content` (text)
- `is_pinned` (boolean, default false)
- `created_at` (timestamptz)

### Politicas RLS
- Participantes podem ler mensagens de suas conversas
- Participantes podem enviar mensagens em suas conversas
- Em canais de comunicados (`announcement`), apenas admins podem enviar
- Admins podem fixar mensagens

### Realtime
- Habilitar realtime na tabela `chat_messages` para mensagens instantaneas
- Habilitar realtime na tabela `chat_participants` para atualizacoes de leitura

### Novos Arquivos Frontend

1. **`src/pages/Chat.tsx`** - Pagina principal do chat com AppLayout
2. **`src/components/chat/ChatSidebar.tsx`** - Lista de conversas com busca e filtros
3. **`src/components/chat/ChatWindow.tsx`** - Area de mensagens com input
4. **`src/components/chat/ChatMessage.tsx`** - Componente de mensagem individual
5. **`src/components/chat/NewConversationSheet.tsx`** - Sheet para criar nova conversa/grupo
6. **`src/components/chat/ChatContactList.tsx`** - Lista de contatos da unidade
7. **`src/hooks/useChat.ts`** - Hook principal com queries, mutations e realtime subscriptions

### Alteracoes em Arquivos Existentes

1. **`src/App.tsx`** - Adicionar rota `/chat`
2. **`src/components/layout/AppLayout.tsx`** - Adicionar item "Chat" no menu lateral com badge de nao lidas (icone MessageCircle, grupo "principal")
3. **`src/types/database.ts`** - Adicionar interfaces de tipos do chat

### Fluxo de Dados

- `useChat` hook gerencia:
  - Fetch de conversas do usuario na unidade ativa (filtrado por `unit_id`)
  - Fetch de mensagens de uma conversa selecionada
  - Envio de mensagens com mutation
  - Subscription realtime em `chat_messages` para novas mensagens
  - Contagem de nao lidas comparando `last_read_at` com `created_at` das mensagens
  - Atualizacao de `last_read_at` ao abrir uma conversa

### Design Visual
- Cards de conversa com glassmorphism e borda neon sutil
- Bolhas de mensagem: enviadas alinhadas a direita com cor primary, recebidas a esquerda com cor card
- Avatar circular com fallback de iniciais
- Input fixo na parte inferior com bordas neon
- Animacao de entrada escalonada (staggered) para mensagens
- Scroll automatico para ultima mensagem
