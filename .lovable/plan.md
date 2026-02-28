

## Plano: CRM Inteligente — Regras de Pontos, Segmentação Automática e Preparação para Integração

### Diagnóstico confirmado
- **A) Pontos**: `loyalty_points` existe no banco mas nunca é calculado automaticamente. O botão "Adicionar Pontos" só soma +10 fixo manualmente.
- **B) Segmentação**: `recalculate_customer_score()` existe mas só roda manualmente via botão "Recalcular Scores" nas configurações.
- **C) Integração**: Já existe import CSV via Edge Function (`import-customers-csv`). Falta um endpoint para receber CSV diário do Colibri com dados de vendas (não só cadastro).
- **D) Roleta → Captura**: A roleta (`SlotMachine`) pede `order_id` e `customer_name` opcionais, mas não exige cadastro de telefone/email.

### Etapas de implementação

#### 1. Trigger automático de score + pontos (Migration)
Criar trigger no banco que, toda vez que `total_spent` ou `total_orders` for atualizado em `customers`, automaticamente:
- Recalcula score/segment via `recalculate_customer_score()`
- Recalcula `loyalty_points` com base nas `loyalty_rules` ativas (tipo `points_per_real`):
  - `loyalty_points = floor(total_spent / threshold) * reward_value`

Isso elimina o cálculo manual e garante que pontos reflitam gastos reais.

#### 2. Endpoint de importação de vendas diárias (Edge Function)
Criar `import-daily-sales` que aceita CSV do Colibri com colunas tipo: `nome, telefone, valor, data`.
- Faz upsert do cliente por telefone
- Soma `total_spent` e `total_orders`
- Atualiza `last_purchase_at`
- O trigger do passo 1 cuida do resto (score + pontos)

#### 3. Roleta → Captura obrigatória de dados
Modificar o fluxo da roleta (`useGamification` + UI) para exigir `nome` + `telefone` antes de girar:
- Ao registrar a jogada, fazer upsert do cliente com `origin: 'mesa'` se não existir
- Vincular `gamification_plays.customer_name` ao cliente real

#### 4. Exibir regra de pontos no detalhe do cliente
No `CustomerDetail`, mostrar a regra ativa (ex: "1 pt a cada R$1 gasto") e o progresso até próximo resgate, usando dados das `loyalty_rules`.

### Detalhes técnicos

**Migration SQL (trigger):**
```sql
CREATE OR REPLACE FUNCTION auto_update_customer_loyalty()
RETURNS trigger AS $$
DECLARE v_rule RECORD;
BEGIN
  -- Recalculate RFM score
  PERFORM recalculate_customer_score(NEW.id);
  -- Recalculate loyalty_points from active rules
  SELECT * INTO v_rule FROM loyalty_rules
    WHERE unit_id = NEW.unit_id AND rule_type = 'points_per_real' AND is_active = true LIMIT 1;
  IF FOUND THEN
    UPDATE customers SET loyalty_points = floor(NEW.total_spent / v_rule.threshold) * v_rule.reward_value
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_customer_loyalty
AFTER UPDATE OF total_spent, total_orders ON customers
FOR EACH ROW EXECUTE FUNCTION auto_update_customer_loyalty();
```

**Edge Function `import-daily-sales`:**
- Recebe CSV com vendas do dia
- Para cada linha: upsert cliente por telefone, incrementa `total_spent` e `total_orders`
- Botão na página de Clientes para upload manual enquanto automação não existe

**Roleta — campos obrigatórios:**
- Adicionar campos `nome` e `telefone` obrigatórios no formulário antes do spin
- Upsert em `customers` com `origin: 'mesa'`

