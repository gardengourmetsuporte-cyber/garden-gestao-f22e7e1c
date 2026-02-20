

# Proximo Nivel de Automacao - Copiloto Autonomo

## O que ja existe hoje (10 tools)

O Copiloto ja executa 10 acoes: criar transacao, criar tarefa, movimentar estoque, marcar transacao como paga, concluir tarefa, excluir tarefa, criar pedido de compra, registrar pagamento de funcionario, validar fechamento de caixa e gerar resumo. Alem disso, analisa imagens e tem contexto rico de todo o negocio.

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

## Nivel 3: Novas Tools do Copiloto (6 novas acoes)

### 3.1 - `update_transaction` - Editar transacao existente
- "Muda o valor da conta de energia para R$350"
- Atualiza descricao, valor, data ou categoria de uma transacao existente

### 3.2 - `create_supplier_invoice` - Registrar boleto/fatura de fornecedor
- "Registra boleto do fornecedor X, R$1500, vence dia 15"
- Insere em `supplier_invoices`

### 3.3 - `mark_invoice_paid` - Pagar boleto de fornecedor
- "Paga o boleto da distribuidora"
- Atualiza `is_paid` em `supplier_invoices`

### 3.4 - `complete_checklist_item` - Marcar item do checklist
- "Marca o item 'limpar balcao' do checklist de abertura"
- Insere em `checklist_completions`

### 3.5 - `send_order` - Enviar pedido para fornecedor
- "Envia o pedido pendente pro fornecedor X"
- Atualiza status do pedido de `draft` para `sent` + `sent_at`

### 3.6 - `create_appointment` - Criar compromisso com horario
- "Agenda reuniao com fornecedor amanha as 14h"
- Insere em `manager_appointments`

---

## Nivel 4: Multi-Tool Chaining (Acoes em Cadeia)

Hoje o Copiloto executa apenas 1 tool por mensagem. O proximo passo e permitir encadeamento:

- "Registra a nota fiscal da imagem, da entrada no estoque e cria o boleto"
  - Tool 1: `register_stock_movement` (entrada dos itens)
  - Tool 2: `create_supplier_invoice` (boleto extraido da NF)
  - Tool 3: `create_transaction` (despesa vinculada)

Isso requer modificar o loop principal da edge function para processar multiplos tool_calls do modelo em sequencia.

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

### Sequencia recomendada de implementacao:

**Fase 1 (impacto imediato):** 6 novas tools (3.1 a 3.6) + Multi-tool chaining (Nivel 4)
- Modifica: `supabase/functions/management-ai/index.ts`
- Adiciona loop de multiplos tool_calls na resposta da IA

**Fase 2 (automacao proativa):** Daily Digest + alertas inteligentes
- Cria: `supabase/functions/daily-digest/index.ts`
- Modifica: sistema de notificacoes existente

**Fase 3 (persistencia):** Chat no banco + auto-rules
- Cria: migracoes para novas tabelas
- Modifica: `src/hooks/useManagementAI.ts` para usar banco em vez de localStorage

### Tabelas novas necessarias:
- `copilot_conversations` (id, user_id, unit_id, created_at)
- `copilot_messages` (id, conversation_id, role, content, image_url, tool_calls, created_at)
- `automation_rules` (id, unit_id, trigger_type, trigger_config, action_type, action_config, is_active)
- `copilot_preferences` (id, user_id, key, value)

### Tabelas existentes usadas (sem alteracao de schema):
- `supplier_invoices` (insert, update)
- `checklist_completions` (insert)
- `orders` (update status)
- `manager_appointments` (insert)
- `finance_transactions` (update)

