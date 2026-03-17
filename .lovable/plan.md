

# Plano: Integrar Produção no Checklist com entrada automática no estoque

## Resumo

Remover o módulo "Produção" da página de Fornecedores/Pedidos e integrá-lo ao Checklist. Itens de checklist poderão ser vinculados a itens de estoque (da categoria Produção). Ao completar o item no checklist, o usuário informa a quantidade produzida e o sistema dá entrada automática no estoque + registra a produção.

## Mudanças no Banco de Dados

1. **Adicionar coluna `linked_inventory_item_id`** na tabela `checklist_items`:
   - `linked_inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL`
   - Quando preenchido, ao completar o item, abre um input de quantidade para registrar produção

2. **Nenhuma tabela nova necessária** — reutiliza `stock_movements` e `production_orders` existentes

## Mudanças no Frontend

### 1. Remover Produção da página de Pedidos (`src/pages/Orders.tsx`)
- Remover tab "Produção" do grid de navegação (volta para 5 tabs: Sugestões, Lista, Pedidos, Cotações, Fornecedores)
- Remover import do `ProductionTab`
- Ajustar grid de 3x2 para 3+2 ou manter 3 colunas

### 2. Modificar o ChecklistView para suportar itens de produção
- No `ChecklistView.tsx`, quando um item tem `linked_inventory_item_id`, ao clicar para completar:
  - Abrir um Sheet/modal pedindo a **quantidade produzida**
  - Mostrar estoque atual e mínimo do item vinculado
  - Ao confirmar: registrar a conclusão do checklist (com pontos) + criar `stock_movement` de entrada + registrar `production_order`

### 3. Configuração de itens (modo admin/settings)
- No formulário de criação/edição de checklist items, adicionar campo opcional "Vincular item de estoque"
  - Dropdown com itens da categoria "Produção" do inventário
  - Quando vinculado, o item no checklist mostra um badge indicando que é item de produção

### 4. Visual no checklist
- Itens de produção mostram um ícone de "ChefHat" ou badge "Produção"
- Ao completar, em vez de toggle simples, abre sheet com:
  - Nome do item de estoque
  - Estoque atual / mínimo
  - Input de quantidade
  - Botão confirmar (dá pontos + entrada no estoque)

## Detalhes Técnicos

- A lógica de `handleToggleItem` no `useChecklistPage.ts` será estendida para verificar se o item tem `linked_inventory_item_id`
- Se sim, o ChecklistView intercepta o clique e abre o sheet de produção antes de chamar `onToggleItem`
- Após confirmar quantidade, chama `onToggleItem` normalmente (para pontos/completion) e em paralelo faz insert em `stock_movements` e `production_orders`
- O hook `useProductionOrders` pode ser mantido para a parte de histórico/consulta no estoque, mas removido da página de Pedidos

## Arquivos afetados
- `src/pages/Orders.tsx` — remover tab Produção
- `src/components/checklists/ChecklistView.tsx` — adicionar sheet de produção ao completar
- `src/hooks/checklists/useChecklistPage.ts` — passar info de inventory items vinculados
- `src/hooks/checklists/useChecklistCRUD.ts` — suportar `linked_inventory_item_id` no addItem/updateItem
- `src/components/checklists/ChecklistSettings.tsx` — adicionar campo de vínculo com estoque no form de item
- Migration SQL — adicionar coluna `linked_inventory_item_id`

