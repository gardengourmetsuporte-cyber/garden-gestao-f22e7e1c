

# Ordem de Produção — Nova aba no módulo Pedidos

## Conceito

Adicionar uma aba **"Produção"** ao módulo de Pedidos (`/orders`) que gera uma lista de preparo baseada nas **fichas técnicas (receitas)** vinculadas a produtos do cardápio. A lógica verifica quais produtos precisam ser preparados com base em um **estoque mínimo de produção** configurável por receita.

## Como funciona

1. **Cada receita ganha um campo `min_ready_stock`** — quantidade mínima de porções prontas que devem estar disponíveis (ex: "sempre ter 10 coxinhas prontas")
2. **Cada receita ganha um campo `current_ready_stock`** — quantidade atual de porções prontas disponíveis
3. A aba Produção lista todas as receitas onde `current_ready_stock < min_ready_stock`, mostrando quanto falta produzir
4. O operador marca as receitas que vai preparar, define quantidades, e ao concluir a produção o sistema:
   - Atualiza o `current_ready_stock`
   - Dá baixa automática no estoque dos ingredientes (saída proporcional)

## Banco de Dados

**Migração 1 — Campos na tabela `recipes`:**
```sql
ALTER TABLE recipes ADD COLUMN min_ready_stock integer DEFAULT 0;
ALTER TABLE recipes ADD COLUMN current_ready_stock integer DEFAULT 0;
```

**Migração 2 — Tabela `production_orders`** para histórico:
```sql
CREATE TABLE production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) NOT NULL,
  recipe_id uuid REFERENCES recipes(id) NOT NULL,
  quantity integer NOT NULL,
  produced_by uuid NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
-- RLS: unit access
CREATE POLICY "unit_access" ON production_orders
  FOR ALL TO authenticated
  USING (user_has_unit_access(auth.uid(), unit_id));
```

## Interface (aba "Produção" em `/orders`)

- **Card de resumo** no topo: "X itens abaixo do mínimo"
- **Lista de receitas** que precisam produção, agrupadas por categoria, mostrando:
  - Nome da receita
  - Estoque atual vs mínimo (ex: `3 / 10`)
  - Quantidade sugerida a produzir (diferença)
  - Botão para ajustar quantidade e iniciar produção
- **Sheet "Produzir"**: confirmar quantidade, ver ingredientes necessários e se há estoque suficiente, marcar como produzido
- **Histórico de produção** acessível via toggle/filtro

## Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `src/components/orders/ProductionTab.tsx` | Criar — UI da aba Produção |
| `src/hooks/useProductionOrders.ts` | Criar — lógica de produção + baixa de estoque |
| `src/pages/Orders.tsx` | Editar — adicionar aba "Produção" ao `orderTab` |
| `src/pages/Recipes.tsx` | Editar — campo min_ready_stock no formulário de receita |

## Fluxo do usuário

```text
Pedidos → aba Produção
  ┌─────────────────────────────┐
  │  ⚠ 4 itens abaixo do mínimo │
  ├─────────────────────────────┤
  │  Coxinha        3/10  [+7]  │
  │  Pão de Queijo  0/15  [+15] │
  │  Brigadeiro     5/8   [+3]  │
  │  Empada         2/6   [+4]  │
  └─────────────────────────────┘
       [ Produzir Selecionados ]
              ↓
  Sheet confirma → dá baixa ingredientes → atualiza estoque pronto
```

