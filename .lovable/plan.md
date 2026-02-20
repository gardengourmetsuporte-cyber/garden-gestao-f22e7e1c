

# Proximo Nivel de Automacao - Copiloto Autonomo

## O que ja existe hoje (16 tools) ✅

O Copiloto executa 16 acoes com suporte a multi-tool chaining (multiplas acoes por mensagem):

**Tools originais (10):** criar transacao, criar tarefa, movimentar estoque, marcar transacao como paga, concluir tarefa, excluir tarefa, criar pedido de compra, registrar pagamento de funcionario, validar fechamento de caixa e gerar resumo.

**Tools novas (6 - Fase 1 concluida):**
- ✅ `update_transaction` - Editar transacao existente
- ✅ `create_supplier_invoice` - Registrar boleto/fatura de fornecedor
- ✅ `mark_invoice_paid` - Pagar boleto de fornecedor
- ✅ `complete_checklist_item` - Marcar item do checklist
- ✅ `send_order` - Enviar pedido para fornecedor
- ✅ `create_appointment` - Criar compromisso com horario

**Multi-Tool Chaining (Nivel 4 concluido):**
- ✅ Loop de ate 5 rounds de tool_calls por mensagem
- ✅ Suporte a multiplas tool_calls paralelas por round

---

## Nivel 2: Automacao Proativa (o sistema age SEM o usuario pedir)

Hoje o Copiloto so age quando o usuario manda uma mensagem. O proximo nivel e ele agir automaticamente.

### 2.1 - Daily Digest Automatico
- Uma funcao backend que roda todo dia de manha (via cron/webhook externo ou chamada agendada)
- Gera um resumo automatico: contas vencendo hoje, estoque critico, tarefas pendentes, fechamento de caixa nao validado
- Envia como notificacao push para o gestor
- Arquivo: nova edge function `daily-digest/index.ts`

### 2.2 - Alertas Inteligentes com Acao
- Quando estoque chegar a zero, o Copiloto automaticamente sugere criar pedido de compra
- Quando boleto vence em 2 dias, notifica e oferece "marcar como pago"
- Quando checklist de abertura nao foi feito ate 10h, alerta o admin
- Integra com o sistema de push notifications ja existente (`push-notifier`)

### 2.3 - Regras Automaticas (Auto-Rules)
- Nova tabela `automation_rules` onde o gestor define regras tipo:
  - "Quando estoque de [item] chegar abaixo de [X], criar pedido automaticamente para [fornecedor]"
  - "Todo dia 5, registrar pagamento de salario para todos os funcionarios"
  - "Quando fechamento de caixa tiver diferenca > R$50, enviar alerta"
- A edge function processa essas regras periodicamente

---

## Nivel 5: Persistencia e Inteligencia de Longo Prazo

### 5.1 - Historico de Chat no Banco de Dados
- Mover de localStorage para tabela `copilot_messages`
- Permite historico entre dispositivos e analise de padrao de uso
- Nova tabela: `copilot_conversations` e `copilot_messages`

### 5.2 - Memoria de Preferencias
- O Copiloto aprende preferencias: "quando falo 'luz', se refere a 'conta de energia eletrica'"
- Tabela `copilot_preferences` com mapeamentos personalizados

---

## Detalhes Tecnicos

### Status de implementacao:

**Fase 1 (CONCLUÍDA ✅):** 6 novas tools + Multi-tool chaining
- Modificado: `supabase/functions/management-ai/index.ts`
- 16 tools totais com loop de multi-tool chaining (ate 5 rounds)

**Fase 2 (pendente):** Daily Digest + alertas inteligentes
- Cria: `supabase/functions/daily-digest/index.ts`
- Modifica: sistema de notificacoes existente

**Fase 3 (pendente):** Chat no banco + auto-rules
- Cria: migracoes para novas tabelas
- Modifica: `src/hooks/useManagementAI.ts` para usar banco em vez de localStorage

### Tabelas novas necessarias (Fase 3):
- `copilot_conversations` (id, user_id, unit_id, created_at)
- `copilot_messages` (id, conversation_id, role, content, image_url, tool_calls, created_at)
- `automation_rules` (id, unit_id, trigger_type, trigger_config, action_type, action_config, is_active)
- `copilot_preferences` (id, user_id, key, value)
