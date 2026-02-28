

## Plano: CRM Inteligente — Regras de Pontos, Segmentação Automática e Preparação para Integração

### ✅ Implementado

#### 1. Trigger automático de score + pontos (Migration)
- Trigger `trg_customer_loyalty` criado no banco
- Toda vez que `total_spent` ou `total_orders` é atualizado em `customers`, automaticamente:
  - Recalcula score/segment via `recalculate_customer_score()`
  - Recalcula `loyalty_points` com base nas `loyalty_rules` ativas (tipo `points_per_real`)

#### 2. Endpoint de importação de vendas diárias (Edge Function)
- `import-daily-sales` criado e deployado
- Aceita CSV flexível (`;` ou `,`) com colunas: nome, telefone, valor, data
- Faz upsert do cliente por telefone/nome
- Incrementa `total_spent` e `total_orders`
- O trigger cuida do resto (score + pontos)
- Botão "Importar vendas (Colibri)" adicionado na página de Clientes

#### 3. Roleta → Captura obrigatória de dados
- Nome e telefone agora são campos obrigatórios antes de girar
- Ao registrar a jogada, faz upsert do cliente com `origin: 'mesa'`
- Máscara de telefone aplicada no input

#### 4. Exibir regra de pontos no detalhe do cliente
- `CustomerDetail` agora mostra regras ativas de fidelidade
- Regra `points_per_real`: "⭐ X pts a cada R$Y gasto"
- Regra `orders_for_free`: progresso visual com barra até o próximo grátis
