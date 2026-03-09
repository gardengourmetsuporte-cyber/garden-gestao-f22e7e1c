

## Plano: Setores de Cozinha (Pistas) no KDS com componentes por receita

### Resumo

Criar setores configuráveis da cozinha (Pista Fria, Pista Quente, Pista Embalagem, Pista Porção, etc.) e vincular cada ingrediente da receita a um setor. Na tela de detalhe do pedido no KDS, além da lista tradicional de itens, exibir um resumo agrupado por setor mostrando todos os componentes que cada pista precisa preparar.

### Banco de dados

**1. Nova tabela `kds_stations`** — setores/pistas configuráveis por unidade:
- `id`, `unit_id`, `name` (ex: "Pista Porção"), `color`, `icon`, `sort_order`
- RLS: admin gerencia, leitura pública (KDS é público)

**2. Adicionar coluna `kds_station_id` em `recipe_ingredients`**:
- FK opcional para `kds_stations` — cada ingrediente pode ser atribuído a uma pista
- Ingredientes sem pista não aparecem no resumo por setor

### Frontend

**3. Tela de admin para gerenciar pistas** — nas configurações do Cardápio (menu-admin), permitir criar/editar/reordenar pistas da cozinha

**4. No cadastro de receita**, ao lado de cada ingrediente, um select para escolher a pista (opcional)

**5. KDS OrderDetail reformulado**:
- Aba/toggle "Pedido" (lista atual) e "Por Setor" (resumo agrupado)
- Na view "Por Setor": cards por pista com cor, mostrando todos os componentes daquele pedido que pertencem àquela pista
- Query do KDS passa a incluir: `tablet_products(name, codigo_pdv, recipe_id, recipes(recipe_ingredients(quantity, unit_type, kds_station_id, kds_stations(name, color), inventory_items(name))))`
- Agrupa ingredientes por `kds_station_id` e renderiza cards separados

### Fluxo de dados

```text
Pedido: 1x GG Boa Vista + 1x Batata
         ↓
Receita "GG Boa Vista" tem ingredientes:
  - Pão brioche      → Pista Quente
  - Catupiry empanado → Pista Porção  
  - Kit sachê        → Pista Embalagem
  - Molho especial   → Pista Embalagem

Receita "Batata" tem ingredientes:
  - Batata frita     → Pista Porção

KDS Detail → Aba "Por Setor":
┌─ Pista Porção (laranja) ──────────┐
│ 1x Catupiry empanado (GG Boa Vista)│
│ 1x Batata frita (Batata)           │
└────────────────────────────────────┘
┌─ Pista Embalagem (roxo) ──────────┐
│ 1x Kit sachê (GG Boa Vista)       │
│ 1x Molho especial (GG Boa Vista)  │
└────────────────────────────────────┘
┌─ Pista Quente (vermelho) ─────────┐
│ 1x Pão brioche (GG Boa Vista)     │
└────────────────────────────────────┘
```

### Arquivos

- **Criar**: migration SQL (tabela + coluna), `src/components/menu-admin/KDSStationsManager.tsx`
- **Editar**: `src/pages/KDS.tsx` (OrderDetail com tabs e resumo por setor), formulário de receita (select de pista no ingrediente), settings do menu-admin (nova seção "Pistas da Cozinha")

