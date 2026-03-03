

## Plano: Agrupar transações por categoria dentro de cada dia

### O que muda
Dentro de cada grupo de dia (ex: "Hoje", "Ontem"), as transações serão automaticamente agrupadas por categoria em seções colapsáveis (accordion). Cada seção mostra o nome da categoria, ícone, cor, subtotal e quantidade de transações. Ao expandir, mostra as transações individuais.

### Como funciona para o usuário
- Dentro de cada dia, em vez de uma lista solta, as transações aparecem organizadas em "pastas" por categoria
- Cada pasta mostra: ícone + nome da categoria, quantidade de transações e subtotal
- As pastas vêm expandidas por padrão para manter a visibilidade
- Transações sem categoria ficam em um grupo "Sem categoria"
- O drag-and-drop de reordenação continua funcionando dentro de cada grupo
- Transferências ficam em um grupo separado "Transferências"

### Mudanças técnicas

**`src/components/finance/FinanceTransactions.tsx`**
- Dentro do loop de `sortedDates`, agrupar as transações do dia por `category_id` (ou por tipo para transferências)
- Renderizar cada grupo de categoria como uma seção com header colapsável usando o componente `Collapsible` do Radix
- O header do grupo mostra: ícone da categoria, nome, badge com contagem e subtotal
- O `SortableContext` do dnd-kit será mantido por grupo de categoria
- Transações com `type === 'transfer'` ficam em grupo próprio

**Estrutura visual por dia:**
```text
┌─ Hoje ──────────────────── R$ +150,00 ─┐
│                                         │
│  ▼ 🛒 Matéria-prima (3)    -R$ 450,00  │
│     ├─ Compra açougue                   │
│     ├─ Hortifruti                       │
│     └─ Bebidas                          │
│                                         │
│  ▼ 🏪 Vendas Balcão (2)    +R$ 600,00  │
│     ├─ Venda manhã                      │
│     └─ Venda tarde                      │
│                                         │
└─────────────────────────────────────────┘
```

**Componentes utilizados:**
- `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` (já instalado via Radix)
- Reutiliza `AppIcon` e cores das categorias existentes

