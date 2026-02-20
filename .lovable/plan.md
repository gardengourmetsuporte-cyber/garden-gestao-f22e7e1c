

# Evolucao do Copiloto Garden - Plano de Autonomia Total

## Estado Atual

O Copiloto hoje possui:
- 3 acoes executaveis: criar transacao, criar tarefa, registrar movimentacao de estoque
- Analise de imagens (notas fiscais, recibos)
- Contexto financeiro, estoque, tarefas, equipe e fornecedores
- Historico de chat em localStorage (maximo 20 mensagens)

## Gaps Identificados

O Copiloto tem acesso SOMENTE LEITURA a muitos dados mas NAO consegue executar acoes sobre eles. Ele ve despesas pendentes mas nao pode marca-las como pagas. Ele ve tarefas do dia mas nao pode completa-las. Ele conhece os fornecedores mas nao pode criar pedidos de compra.

---

## Novas Funcoes a Adicionar (7 novas tools)

### Grupo 1 - Acoes Rapidas (alta frequencia de uso)

**1. `mark_transaction_paid`** - Marcar despesa como paga
- O gestor pergunta "quais despesas estao pendentes?" e depois diz "paga a conta de energia"
- Busca a transacao por descricao (ILIKE) + is_paid=false, atualiza para is_paid=true
- Parametros: description (busca), date (opcional para desambiguar)

**2. `complete_task`** - Marcar tarefa como concluida
- "Conclui a tarefa de ligar pro fornecedor"
- Busca por titulo (ILIKE) + is_completed=false, atualiza is_completed=true + completed_at
- Parametros: title (busca)

**3. `delete_task`** - Excluir uma tarefa
- "Remove a tarefa X da agenda"
- Busca por titulo e deleta
- Parametros: title (busca)

### Grupo 2 - Operacoes de Compra

**4. `create_order`** - Criar pedido de compra para fornecedor
- "Faz um pedido de 20kg de frango pro fornecedor X"
- Cria registro em `orders` + `order_items` vinculando ao fornecedor e item do inventario
- Parametros: supplier_name, items (array com item_name + quantity), notes

### Grupo 3 - Gestao de Equipe

**5. `register_employee_payment`** - Registrar pagamento de funcionario
- "Registra adiantamento de R$500 pro Joao"
- Insere em `employee_payments` com tipo (salary, advance, bonus, commission)
- Parametros: employee_name, amount, type, payment_date, notes

### Grupo 4 - Inteligencia e Relatorios

**6. `generate_summary`** - Gerar resumo executivo do periodo
- "Me da um resumo da semana" ou "Como foi o mes?"
- NAO e uma acao de escrita - instrui a IA a formatar um relatorio estruturado com os dados do contexto
- Parametros: period (today, week, month)

**7. `mark_closing_validated`** - Validar fechamento de caixa pendente
- "Valida o fechamento de caixa de ontem"
- Atualiza status do cash_closing para 'validated' + validated_by + validated_at
- Parametros: date (busca)

---

## Melhorias na Interface (Copilot.tsx)

### Chips de Sugestao Rapida
Adicionar chips clicaveis abaixo do input com acoes frequentes:
- "Resumo do dia"
- "Despesas pendentes"
- "Estoque baixo"
- "Criar tarefa"

### Markdown nas respostas
Usar formatacao basica para tabelas e listas nas respostas da IA (negrito, listas).

### Feedback visual de acao
Apos executar uma acao, mostrar um mini-toast dentro do chat confirmando e oferecendo "Desfazer" quando possivel.

---

## Melhorias no Prompt/Contexto

### Contexto mais inteligente
- Adicionar **checklists do dia** (abertura/fechamento - % completo)
- Adicionar **boletos/faturas vencendo** (supplier_invoices com due_date proxima)
- Adicionar **metas de orcamento** (finance_budgets vs realizado)

### Prompt refinado
- Instruir a IA a sugerir acoes proativamente (ex: "Voce tem 3 despesas pendentes, quer que eu marque alguma como paga?")
- Adicionar regras de confirmacao para acoes destrutivas (delete)

---

## Detalhes Tecnicos

### Arquivos a modificar:
1. **`supabase/functions/management-ai/index.ts`** - Adicionar 7 novas definicoes de tools + funcoes executoras
2. **`src/hooks/useManagementAI.ts`** - Adicionar dados de checklists, boletos e orcamentos ao contexto
3. **`src/pages/Copilot.tsx`** - Adicionar chips de sugestao, suporte a markdown nas respostas

### Tabelas envolvidas (somente leitura/update, sem schema changes):
- `finance_transactions` (update is_paid)
- `manager_tasks` (update is_completed, delete)
- `orders` + `order_items` (insert)
- `employee_payments` (insert)
- `cash_closings` (update status)
- `checklist_completions` + `checklist_items` (leitura para contexto)
- `supplier_invoices` (leitura para contexto)
- `finance_budgets` (leitura para contexto)

### Sequencia de implementacao:
1. Adicionar novas tools na edge function (todas de uma vez)
2. Expandir contexto no hook
3. Atualizar UI com chips e markdown
4. Deploy e teste

