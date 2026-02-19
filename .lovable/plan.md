

# Plano: Central de Alertas + Setup Guide + Log de Auditoria

---

## 1. Central de Alertas (/alerts)

Uma pagina dedicada full-page para visualizar, filtrar e agir sobre todas as notificacoes.

**O que sera feito:**

- Nova pagina `src/pages/Alerts.tsx` com layout padrao (AppLayout)
- Busca TODAS as notificacoes (lidas e nao lidas) do usuario, com paginacao
- Filtros por: origem (estoque, financeiro, checklist, sistema), tipo (info, alert, success), status (lido/nao lido)
- Cada alerta tera botao de acao direta contextual:
  - Origem "estoque" -> botao "Ver Estoque" navega para /inventory
  - Origem "financeiro" -> botao "Ver Financeiro" navega para /finance
  - Origem "checklist" -> botao "Ver Checklist" navega para /checklists
- Botao "Marcar todas como lidas" no topo
- Rota `/alerts` registrada no App.tsx como ProtectedRoute
- Modulo adicionado em `src/lib/modules.ts`
- Link adicionado na navegacao (AppLayout navItems)

**Arquivos envolvidos:**
- `src/pages/Alerts.tsx` (novo)
- `src/App.tsx` (nova rota)
- `src/lib/modules.ts` (novo modulo)
- `src/components/layout/AppLayout.tsx` (novo item de nav)
- `src/hooks/useNotifications.ts` (nova funcao para buscar todas as notificacoes, incluindo lidas)

---

## 2. Setup Guide (Checklist de Primeiro Uso)

Uma barra de progresso persistente no dashboard que guia o admin nos primeiros passos.

**O que sera feito:**

- Novo componente `src/components/dashboard/SetupGuide.tsx`
- Exibido apenas para admins que ainda nao completaram todos os passos
- 5 passos verificados em tempo real contra o banco:
  1. "Cadastre um fornecedor" -> verifica se existe ao menos 1 supplier
  2. "Adicione um item ao estoque" -> verifica se existe ao menos 1 inventory_item
  3. "Configure um checklist" -> verifica se existe ao menos 1 checklist_item
  4. "Convide um funcionario" -> verifica se existe mais de 1 user_unit na unidade
  5. "Faca seu primeiro fechamento" -> verifica se existe ao menos 1 cash_closing
- Cada passo incompleto mostra um botao CTA que navega para o modulo correto
- Quando todos concluidos, exibe mensagem de parabens e um botao para dispensar permanentemente (salvo em localStorage)
- Barra de progresso visual estilo iOS no topo do card
- Integrado no `AdminDashboard.tsx` logo apos o welcome header

**Arquivos envolvidos:**
- `src/components/dashboard/SetupGuide.tsx` (novo)
- `src/hooks/useSetupProgress.ts` (novo - hook que consulta o banco)
- `src/components/dashboard/AdminDashboard.tsx` (integrar o componente)

---

## 3. Log de Auditoria

Registro automatico de acoes criticas com visualizacao para admins.

**O que sera feito:**

### Banco de dados:
- Nova tabela `audit_logs` com colunas:
  - `id` (uuid, PK)
  - `user_id` (uuid, NOT NULL)
  - `unit_id` (uuid, nullable)
  - `action` (text) - ex: "stock_movement", "transaction_created", "checklist_completed", "cash_closing_created"
  - `entity_type` (text) - ex: "inventory_items", "finance_transactions"
  - `entity_id` (uuid, nullable)
  - `details` (jsonb) - metadados da acao (ex: quantidade, valor)
  - `created_at` (timestamptz, default now())
- RLS: admins podem visualizar logs da unidade; insercao via SECURITY DEFINER function
- Funcao `log_audit_event()` SECURITY DEFINER chamada por triggers nos pontos criticos

### Triggers automaticos:
- `stock_movements` -> INSERT: registra movimentacao de estoque
- `finance_transactions` -> INSERT/DELETE: registra transacao financeira criada/removida
- `cash_closings` -> INSERT/UPDATE: registra fechamento de caixa
- `checklist_completions` -> INSERT: registra checklist completado

### Frontend:
- Novo componente `src/components/settings/AuditLogSettings.tsx` (visualizador)
- Listagem paginada com filtros por tipo de acao e periodo
- Exibe: quem fez, o que fez, quando, em qual modulo
- Nomes de usuario resolvidos via join com profiles
- Acessivel em Configuracoes > Log de Atividades (somente admin)
- Nova entrada no menu de Settings

**Arquivos envolvidos:**
- Migration SQL (nova tabela + funcao + triggers)
- `src/components/settings/AuditLogSettings.tsx` (novo)
- `src/hooks/useAuditLogs.ts` (novo)
- `src/pages/Settings.tsx` (novo item de menu + renderizacao)

---

## Secao Tecnica

### Ordem de implementacao:
1. Migration do banco (audit_logs + funcao + triggers)
2. Central de Alertas (pagina + rota + navegacao)
3. Setup Guide (hook + componente + integracao no dashboard)
4. Log de Auditoria (hook + componente + integracao em Settings)

### Estimativa de arquivos:
- 5 novos arquivos
- 5 arquivos editados
- 1 migration SQL

### Impacto em performance:
- Setup Guide faz 5 COUNT queries leves na montagem (com staleTime alto)
- Audit Logs usa paginacao (LIMIT 50) para nao sobrecarregar
- Central de Alertas reutiliza a tabela notifications existente, sem nova tabela

