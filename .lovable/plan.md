

## Plano: Módulo de Acompanhamento de Preços

### Onde adicionar

Nova aba **"Preços"** dentro da página de Fornecedores (`/orders`), junto às 4 abas existentes (Fornecedores, Lista, Pedidos, Cotações) — passa para 5 abas em `grid-cols-5`. Faz sentido aqui porque os dados de preço já vêm das cotações e pesquisas de preço vinculadas a fornecedores.

### O que será exibido

1. **Cards de resumo no topo**: Total de itens monitorados, itens com alta (vermelho ↑), itens com queda (verde ↓), itens estáveis
2. **Lista de itens com variação de preço**: Cada card mostra:
   - Nome do item, categoria, fornecedor atual
   - Preço atual vs último preço registrado → % de variação (badge verde/vermelho)
   - Mini sparkline dos últimos 5-10 registros de preço (usando Recharts, já no projeto)
   - Ícone de alerta quando variação > threshold (ex: 10%)
3. **Filtros**: Busca por nome, filtro por "Só aumentos" / "Só quedas" / "Todos"
4. **Detalhe do item** (ao clicar): Sheet com gráfico de linha completo do histórico de preços (`supplier_price_history`), listando cada registro com data, fornecedor e valor

### Dados

Já existem duas tabelas prontas:
- **`supplier_price_history`**: histórico completo (item_id, supplier_id, unit_price, recorded_at)
- **`supplier_last_prices`**: último preço por fornecedor/item (unit_price, updated_at)
- **`inventory_items.unit_price`**: preço atual do item

Não precisa de migração — os dados já estão sendo alimentados automaticamente pelas cotações e pesquisas de preço.

### Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| `src/hooks/usePriceTracking.ts` | **Novo** — Hook que busca `inventory_items` + `supplier_price_history` e calcula variações |
| `src/components/orders/PriceTrackingTab.tsx` | **Novo** — Componente da aba com cards de resumo, lista e filtros |
| `src/components/orders/PriceDetailSheet.tsx` | **Novo** — Sheet com gráfico de histórico do item |
| `src/pages/Orders.tsx` | **Editar** — Adicionar aba "Preços" (grid-cols-5), importar PriceTrackingTab |

### Layout

Segue o padrão do sistema: cards `card-base rounded-2xl`, ícones circulares com gradiente 135°, badges de variação, AppIcon + AppLayout.

