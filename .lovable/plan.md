

## Correção: "null value in column product_id" ao enviar pedido

### Problema
A coluna `product_id` na tabela `tablet_order_items` tem constraint `NOT NULL`, mas quando um pedido é carregado (via `loadOrderIntoCart`), os itens recebem `product.id = ''` (string vazia). Na hora de enviar, `c.product.id || null` resulta em `null`, violando a constraint.

### Solução

1. **Migração**: Alterar a coluna `product_id` em `tablet_order_items` para aceitar `NULL` (`ALTER TABLE tablet_order_items ALTER COLUMN product_id DROP NOT NULL`). Isso é necessário porque itens carregados de pedidos existentes podem não ter o `product_id` original mapeado.

2. **Código (`usePOS.ts`)**: Manter o `c.product.id || null` como está — com a coluna nullable, funcionará corretamente.

### Arquivo afetado
- Migração SQL (1 linha)
- Nenhuma mudança de código necessária

