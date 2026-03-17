

## Plano: Unificar Fornecedores + Sugestões em uma aba única

### Problema
As abas "Sugestões" e "Fornecedores" são redundantes — ambas giram em torno de fornecedores. Se o botão "Pedir" (que já existe em Sugestões) for adicionado aos cards de fornecedores, os dois módulos se fundem naturalmente.

### Solução

Remover a aba "Fornecedores" separada e criar uma aba unificada **"Fornecedores"** que mostra:

1. **Barra de busca** (já existe na aba fornecedores)
2. **Lista de fornecedores como cards**, cada card mostrando:
   - Nome, telefone, badge "Diário"
   - **Itens abaixo do estoque mínimo** vinculados a esse fornecedor (dados de Sugestões)
   - **Botão "Pedir"** quando há itens para pedir (lógica já existe em `handleOpenOrder`)
   - Clique no card abre o `SupplierProfileSheet`
3. **Seção "Sem Fornecedor"** no final para itens sem fornecedor vinculado (igual ao card atual de Sugestões)

### Mudanças técnicas

**`src/pages/Orders.tsx`**:
- Remover a aba `to-order` (Sugestões) do grid de tabs — reduz de 5 para 4 abas
- Renomear a aba `suppliers` para incorporar a lógica de `to-order`
- No conteúdo da aba `suppliers`, para cada fornecedor:
  - Mostrar o card existente do fornecedor
  - Dentro do card, listar os itens `lowStock` vinculados (de `itemsBySupplier[supplier.id]`)
  - Adicionar botão "Pedir" (reusa `handleOpenOrder`) quando há itens pendentes
  - Badge com contagem de itens abaixo do mínimo
- Mover a seção "Sem Fornecedor" (`itemsBySupplier['no-supplier']`) para o final da lista
- Tab default passa a ser `suppliers` em vez de `to-order`

**Grid de tabs**: 4 abas (Fornecedores, Lista, Pedidos, Cotações) em `grid-cols-4`

