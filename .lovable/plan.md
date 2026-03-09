

# Embalagem por Produto (Templates de Embalagem)

## Problema
Hoje o custo de embalagem é um valor fixo global (R$ 2,00) aplicado igualmente a todos os produtos — uma água não deveria ter o mesmo custo de embalagem que um lanche completo.

## Solução: Templates de Embalagem reutilizáveis

Criar **templates de embalagem** (ex: "Embalagem Lanche", "Embalagem Bebida") com itens detalhados e custos, que podem ser vinculados a cada receita individualmente.

```text
┌─────────────────────────────────┐
│  Templates de Embalagem         │
│                                 │
│  📦 Embalagem Lanche  R$ 2,50  │
│     • Caixa kraft     R$ 1,50  │
│     • Papel manteiga  R$ 0,30  │
│     • Guardanapo 2x   R$ 0,20  │
│     • Sacola          R$ 0,50  │
│                                 │
│  📦 Embalagem Bebida  R$ 0,30  │
│     • Copo plástico   R$ 0,20  │
│     • Tampa           R$ 0,10  │
│                                 │
│  [+ Nova Embalagem]             │
└─────────────────────────────────┘

Na ficha técnica:
  Embalagem: [Selecionar template ▼]  → R$ 2,50
```

## Mudanças Técnicas

### 1. Banco de dados (2 tabelas novas)
- **`packaging_templates`**: `id`, `user_id`, `unit_id`, `name`, `created_at`, `updated_at`
- **`packaging_template_items`**: `id`, `template_id`, `name`, `cost`, `quantity`, `sort_order`
- **`recipes`**: adicionar coluna `packaging_template_id` (nullable, FK para `packaging_templates`)
- RLS: usuário só vê seus próprios templates

### 2. Hook `usePackagingTemplates`
- CRUD de templates e seus itens
- Cálculo automático do custo total do template (soma dos itens × quantidade)

### 3. UI de gerenciamento (dentro de Configurações de Custos)
- Seção para criar/editar/excluir templates de embalagem
- Cada template com lista de itens (nome + custo unitário + quantidade)
- Mostrar custo total calculado

### 4. RecipeSheet — Seletor de embalagem
- Substituir custo fixo global por um `<Select>` de template de embalagem
- Opção "Sem embalagem" (custo = 0)
- Mostrar custo detalhado na seção "Custos Variáveis"

### 5. Cálculo de custos
- `calculateOperationalCosts` não incluirá mais `packaging_cost_per_unit`
- O custo de embalagem vem do template vinculado à receita
- O campo global `packaging_cost_per_unit` fica como fallback para receitas sem template

