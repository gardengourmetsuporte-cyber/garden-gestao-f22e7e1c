

# Painel de Gerenciamento do Agente Copiloto IA

## Situação Atual

Atualmente **não existe** uma página de configuração/gerenciamento do agente Copiloto. O prompt do sistema, as tools e o contexto estão hardcoded na edge function `management-ai`. A base de conhecimento (knowledge base) existe apenas para o WhatsApp (`whatsapp_knowledge`), não para o Copilot principal.

## O que será construído

Uma nova página `/copilot/settings` com abas para gerenciar o agente:

### Aba 1 — Prompt & Personalidade
- Editor de texto para o **prompt do sistema** (instrução principal do agente)
- Campo para **nome do agente** e **tom de voz**
- Preview do prompt final montado
- Salva em nova tabela `copilot_agent_config`

### Aba 2 — Base de Conhecimento (RAG)
- Reutiliza o padrão do `WhatsAppKnowledge` adaptado para o Copilot
- CRUD de artigos com título, conteúdo, categoria e toggle ativo/inativo
- Os artigos são injetados no contexto do agente automaticamente
- Nova tabela `copilot_knowledge` (mesma estrutura de `whatsapp_knowledge`)

### Aba 3 — Ferramentas (Tools)
- Lista as 16 tools disponíveis do agente com toggle para ativar/desativar cada uma
- Descrição de cada ferramenta e quando é usada
- Salva em `copilot_agent_config.enabled_tools` (array JSON)

### Aba 4 — Integrações / MCPs
- Lista de integrações disponíveis (WhatsApp, n8n, etc.)
- Status de conexão de cada uma
- Links para configurar cada integração

## Mudanças no Banco de Dados

```sql
-- Configuração do agente por unidade
CREATE TABLE public.copilot_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agent_name text DEFAULT 'Copiloto Garden',
  system_prompt text,
  tone_of_voice text DEFAULT 'profissional e amigável',
  enabled_tools text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Base de conhecimento do Copilot
CREATE TABLE public.copilot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS para ambas tabelas
ALTER TABLE public.copilot_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_knowledge ENABLE ROW LEVEL SECURITY;
-- Policies via user_units join
```

## Mudanças na Edge Function `management-ai`

- Buscar `copilot_agent_config` da unidade para customizar o prompt do sistema
- Buscar artigos ativos de `copilot_knowledge` e injetar como contexto RAG
- Filtrar tools habilitadas pelo `enabled_tools`

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/CopilotSettings.tsx` | Criar — página principal com abas |
| `src/components/copilot/AgentPromptEditor.tsx` | Criar — editor de prompt |
| `src/components/copilot/CopilotKnowledgeBase.tsx` | Criar — CRUD de artigos RAG |
| `src/components/copilot/AgentToolsManager.tsx` | Criar — toggle de tools |
| `src/components/copilot/AgentIntegrations.tsx` | Criar — status de integrações |
| `src/hooks/useCopilotConfig.ts` | Criar — hook para config do agente |
| `src/App.tsx` | Adicionar rota `/copilot/settings` |
| `supabase/functions/management-ai/index.ts` | Atualizar — ler config + knowledge |
| Migração SQL | Criar tabelas + RLS |

