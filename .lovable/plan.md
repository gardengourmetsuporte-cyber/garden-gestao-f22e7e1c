

# Modulo: Atendimento Inteligente via WhatsApp (MVP)

## Visao Geral

Criar um sistema de atendimento automatizado via WhatsApp que usa IA para conversar com clientes, consultar o cardapio (tablet_products), gerar pedidos e escalar para atendimento humano quando necessario. A arquitetura e agnóstica ao provedor de WhatsApp -- funciona com Evolution API, Z-API, Twilio ou Meta diretamente.

---

## Arquitetura do MVP

```text
Cliente WhatsApp
      |
      v
Provedor (Evolution/Z-API/Twilio)
      |
      v (webhook POST)
Edge Function: whatsapp-webhook
      |
      +---> Salva mensagem no banco
      +---> Busca contexto (historico, cardapio, estoque)
      +---> Chama IA (Lovable AI Gateway)
      +---> IA decide acao:
      |       - Responder com texto
      |       - Montar pedido
      |       - Escalar para humano
      +---> Envia resposta via API do provedor
      +---> Salva resposta no banco
```

---

## Etapa 1: Banco de Dados (6 tabelas novas)

### 1.1 `whatsapp_channels` -- Configuracao por unidade/numero
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| unit_id | uuid | FK para units |
| phone_number | text | Numero do WhatsApp |
| provider | text | 'evolution', 'zapi', 'twilio', 'meta' |
| api_url | text | URL base da API do provedor |
| is_active | boolean | Ativa/desativa o atendimento IA |
| ai_personality | text | Prompt de personalidade da marca |
| business_hours | jsonb | Horario de funcionamento |
| fallback_message | text | Mensagem fora do horario |
| created_at, updated_at | timestamptz | Timestamps |

### 1.2 `whatsapp_contacts` -- CRM basico (por telefone)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| unit_id | uuid | FK para units |
| phone | text | Telefone do cliente |
| name | text | Nome identificado |
| notes | text | Observacoes |
| total_orders | int | Contador de pedidos |
| last_interaction_at | timestamptz | Ultima interacao |
| created_at | timestamptz | Timestamp |

### 1.3 `whatsapp_conversations` -- Sessao de conversa
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| channel_id | uuid | FK para whatsapp_channels |
| contact_id | uuid | FK para whatsapp_contacts |
| status | text | 'ai_active', 'human_active', 'closed' |
| assigned_to | uuid | Atendente humano (nullable) |
| ai_context | jsonb | Contexto acumulado da IA |
| started_at, closed_at | timestamptz | Timestamps |
| created_at | timestamptz | Timestamp |

### 1.4 `whatsapp_messages` -- Historico completo
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK para whatsapp_conversations |
| direction | text | 'inbound' ou 'outbound' |
| sender_type | text | 'customer', 'ai', 'human' |
| content | text | Conteudo da mensagem |
| metadata | jsonb | Dados extras (tipo midia, etc) |
| created_at | timestamptz | Timestamp |

### 1.5 `whatsapp_orders` -- Pedidos gerados pelo WhatsApp
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK para whatsapp_conversations |
| contact_id | uuid | FK para whatsapp_contacts |
| unit_id | uuid | FK para units |
| items | jsonb | Array de {product_id, name, qty, price} |
| total | numeric | Total do pedido |
| status | text | 'draft', 'confirmed', 'cancelled' |
| notes | text | Observacoes do cliente |
| created_at, updated_at | timestamptz | Timestamps |

### 1.6 `whatsapp_ai_logs` -- Decisoes da IA (debug/auditoria)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK |
| message_id | uuid | FK |
| action | text | 'respond', 'create_order', 'escalate', 'off_hours' |
| reasoning | text | Explicacao da IA |
| context_used | jsonb | Dados que a IA consultou |
| created_at | timestamptz | Timestamp |

### Politicas RLS
- Todas as tabelas: leitura e escrita restrita a admins (`has_role(auth.uid(), 'admin')`)
- A Edge Function usa service_role_key para bypassar RLS

---

## Etapa 2: Edge Function `whatsapp-webhook`

Endpoint que recebe mensagens do provedor de WhatsApp e processa com IA.

### Fluxo interno:
1. Recebe POST do webhook do provedor
2. Normaliza o payload (adapter pattern para cada provedor)
3. Busca/cria contato na tabela `whatsapp_contacts`
4. Busca/cria conversa ativa na `whatsapp_conversations`
5. Salva mensagem recebida em `whatsapp_messages`
6. Verifica horario de funcionamento
7. Se fora do horario: envia mensagem de fallback e encerra
8. Busca contexto:
   - Ultimas 20 mensagens da conversa
   - Cardapio ativo (`tablet_products` da unidade)
   - Pedido em andamento (se houver)
9. Chama Lovable AI Gateway com tool calling:
   - Tool `search_menu`: busca produtos por nome/categoria
   - Tool `create_order`: monta pedido com itens
   - Tool `escalate_to_human`: escala para atendente
   - Tool `respond`: responde com texto livre
10. Executa a acao retornada pela IA
11. Salva resposta em `whatsapp_messages`
12. Envia resposta via API do provedor
13. Registra log em `whatsapp_ai_logs`

### Adapters de provedor:
- `parseIncoming(provider, body)` -- normaliza payload de entrada
- `sendMessage(provider, apiUrl, phone, text, apiKey)` -- envia resposta

---

## Etapa 3: Edge Function `whatsapp-send`

Funcao auxiliar para enviar mensagens manualmente (atendimento humano).

- Recebe: `{ conversation_id, content }`
- Valida autenticacao do admin
- Busca dados da conversa/canal
- Envia via API do provedor
- Salva em `whatsapp_messages` com sender_type='human'

---

## Etapa 4: Interface Administrativa

### 4.1 Pagina `/whatsapp` (nova rota protegida, admin only)
- Adicionada ao menu lateral no grupo "Operacao"

### 4.2 Aba "Conversas" (tela principal)
- Lista de conversas ativas com:
  - Nome/telefone do contato
  - Ultima mensagem
  - Status (IA | Humano | Fechada)
  - Badge de nao lidas
- Ao clicar: abre painel de chat com historico completo
  - Mensagens da IA em cor diferente das do cliente e do humano
  - Botao "Assumir Atendimento" (troca status para human_active)
  - Botao "Devolver para IA" (troca status para ai_active)
  - Campo de input para enviar mensagem manual
  - Visualizacao do pedido montado pela IA (se houver)

### 4.3 Aba "Configuracoes"
- Formulario para configurar canal WhatsApp:
  - Numero, provedor, URL da API
  - Chave de API (salva como secret via edge function)
  - Personalidade da IA (textarea com prompt)
  - Horario de funcionamento (grid de dias/horas)
  - Mensagem fora do horario
  - Toggle ativar/desativar

### 4.4 Aba "Pedidos"
- Lista de pedidos gerados via WhatsApp
- Status, itens, total, contato
- Acao de confirmar/cancelar pedido

### 4.5 Aba "Logs"
- Tabela com decisoes da IA
- Filtros por data, acao, conversa
- Detalhes do raciocinio e contexto usado

---

## Etapa 5: Hooks e Integracao

### Novos hooks (todos com React Query):
- `useWhatsAppChannels` -- CRUD de canais
- `useWhatsAppConversations` -- lista conversas com realtime
- `useWhatsAppMessages` -- mensagens de uma conversa com realtime
- `useWhatsAppOrders` -- pedidos via WhatsApp
- `useWhatsAppLogs` -- logs da IA

### Integracao com modulos existentes:
- Cardapio: consulta `tablet_products` filtrado por `unit_id`
- Multi-unidade: cada canal e vinculado a uma unidade
- Todas as tabelas novas tem `unit_id` seguindo a regra de multi-tenant

---

## Arquivos que serao criados/modificados

### Novos arquivos:
| Arquivo | Descricao |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Webhook principal + IA |
| `supabase/functions/whatsapp-send/index.ts` | Envio manual de mensagens |
| `src/pages/WhatsApp.tsx` | Pagina administrativa |
| `src/components/whatsapp/ConversationList.tsx` | Lista de conversas |
| `src/components/whatsapp/ConversationChat.tsx` | Painel de chat |
| `src/components/whatsapp/WhatsAppSettings.tsx` | Configuracoes do canal |
| `src/components/whatsapp/WhatsAppOrders.tsx` | Lista de pedidos |
| `src/components/whatsapp/WhatsAppLogs.tsx` | Logs da IA |
| `src/hooks/useWhatsApp.ts` | Hooks para todas as tabelas |
| `src/types/whatsapp.ts` | Tipos TypeScript |

### Arquivos modificados:
| Arquivo | Mudanca |
|---|---|
| `src/App.tsx` | Adicionar rota `/whatsapp` |
| `src/components/layout/AppLayout.tsx` | Adicionar item no menu lateral |
| `supabase/config.toml` | Registrar as 2 novas edge functions |

---

## Prompt da IA (base)

A IA recebera um system prompt com:
- Personalidade configurada pelo admin
- Regras fixas: nunca inventar, sempre consultar, escalar na duvida
- Cardapio atual formatado
- Horario de funcionamento
- Historico da conversa
- Tools disponiveis (search_menu, create_order, escalate_to_human, respond)

---

## O que NAO esta no MVP (futuras expansoes)

- Envio de imagens/midia
- Pagamento inline pelo WhatsApp
- Integracao com Colibri/PDV
- Relatorios avancados de conversao
- Multiplos atendentes simultaneos
- Chatbot para FAQ/perguntas frequentes
- Notificacoes push para admins sobre escalacoes

---

## Fluxo de configuracao para o usuario

1. Escolher e configurar o provedor de WhatsApp (Evolution API, Z-API, etc.)
2. Na tela de Configuracoes do modulo, inserir URL da API e chave
3. Configurar o webhook do provedor para apontar para a Edge Function
4. Personalizar a IA e horarios
5. Ativar o canal

O sistema fornecera a URL do webhook para copiar e colar no provedor.

