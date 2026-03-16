

# Reestruturação do Módulo Copilot — Hub de Gestão do Agente

## Situação Atual
- `/copilot` = Tela de chat (vai continuar igual)
- `/copilot/settings` = Configurações com 4 abas (Prompt, RAG, Tools, MCPs)
- O chat no dashboard (widget) já existe e permanece

## O que muda

A página `/copilot/settings` será transformada em um **Hub completo de gestão do agente** com mais seções e visual mais rico. O chat permanece **apenas** no `/copilot` e no widget do dashboard.

### Nova estrutura de abas (6 abas → scroll horizontal no mobile):

| Aba | Conteúdo | Status |
|-----|----------|--------|
| **Personalidade** | Nome do agente, tom de voz, prompt de sistema, avatar | Já existe (AgentPromptEditor), será melhorado |
| **Conhecimento** | Base RAG com artigos, regras e políticas | Já existe (CopilotKnowledgeBase) |
| **Ferramentas** | Toggle das 16 capacidades do agente | Já existe (AgentToolsManager) |
| **Permissões** | Quem pode usar o Copilot, níveis de acesso por papel | **Novo** |
| **Integrações** | WhatsApp, n8n, Zapier, iFood | Já existe (AgentIntegrations) |
| **Preferências** | Idioma, limites de resposta, horário ativo, notificações | **Novo** |

### Detalhes das novas seções

**Permissões** — Controla quem na equipe pode interagir com o Copilot:
- Toggle global (ativar/desativar copilot para a unidade)
- Lista de papéis (admin, gerente, operador) com switch de acesso
- Opção de restringir ferramentas destrutivas (ex: criar transação) apenas para admins

**Preferências** — Configurações gerais do comportamento:
- Idioma de resposta (PT-BR padrão)
- Tamanho máximo de resposta (curta/média/detalhada)
- Horário ativo (ex: apenas durante expediente)
- Toggle de auto-greeting na abertura

### Mudanças técnicas

1. **`src/pages/CopilotSettings.tsx`** — Redesenhar com as 6 abas usando ícones circulares coloridos (padrão novo do projeto) e scroll horizontal
2. **`src/components/copilot/AgentPermissions.tsx`** — Novo componente para controle de acesso
3. **`src/components/copilot/AgentPreferences.tsx`** — Novo componente para preferências gerais
4. **`src/hooks/useCopilotConfig.ts`** — Expandir o tipo `CopilotAgentConfig` para incluir novos campos (permissions, preferences)
5. **Migração SQL** — Adicionar colunas à tabela `copilot_agent_config`: `allowed_roles text[]`, `restrict_destructive_tools boolean`, `max_response_length text`, `active_hours jsonb`, `auto_greet boolean`, `language text`

### Visual
- Header com gradiente e mascote
- Abas com ícones circulares coloridos (mesmo padrão do AnimatedTabs)
- Cards organizados por seção com visual consistente

