

## Plano: Filtro por Data + Agrupamento por Status Operacional

### O que muda

A tela de pedidos do cardápio ganha:

1. **Filtro de período** — Pills rápidos (Hoje, Ontem, 7 dias) + DatePicker para data customizada, posicionados logo abaixo dos Channel Pills
2. **Agrupamento por status operacional** em 4 seções ordenadas por prioridade:
   - **Novos** (pending, awaiting_confirmation, new, confirmed, accepted) — badge pulsante amber
   - **Em Preparo** (preparing) — badge pulsante orange  
   - **Prontos** (ready) — badge emerald
   - **Entregues** (delivered, sent_to_pdv, dispatched) — badge muted, colapsável
   - Cancelados ficam ao final, colapsados por padrão
3. **Stats bar** atualiza conforme o filtro de data selecionado

### Arquivo modificado

**`src/components/cardapio/CardapioOrdersView.tsx`**

- Adicionar estado `dateFilter` com opções: `'today' | 'yesterday' | '7days' | 'custom'` e `customDate: Date`
- Importar `DatePicker` e `format`/`subDays`/`isWithinInterval`/`startOfDay` de `date-fns`
- Renderizar barra de filtro de período com pills horizontais + ícone de calendário que abre o DatePicker
- Substituir a lógica de agrupamento atual (active/done/error/other) por 4 grupos operacionais: `novos`, `emPreparo`, `prontos`, `entregues` + `cancelados`
- Cada seção tem header com ícone, label, contagem e é colapsável (entregues/cancelados começam colapsados quando há muitos itens)
- Filtro de data aplica `created_at.slice(0,10)` match contra a data/range selecionado
- Stats bar recalcula com base no filtro ativo

### Detalhes técnicos

```text
┌─────────────────────────────┐
│ [Todos] [Delivery] [Mesa].. │  ← Channel Pills (existente)
├─────────────────────────────┤
│ [●Hoje] [Ontem] [7d] [📅]  │  ← NOVO: Date filter pills
├─────────────────────────────┤
│  3 Em preparo │ 5 Done │ R$ │  ← Stats (filtrado por data)
├─────────────────────────────┤
│ 🔴 NOVOS (2)                │
│  ┌ Card ──────────────────┐ │
│  └────────────────────────┘ │
│ 🟠 EM PREPARO (1)           │
│  ┌ Card ──────────────────┐ │
│  └────────────────────────┘ │
│ 🟢 PRONTOS (3)              │
│  ┌ Card ──────────────────┐ │
│  └────────────────────────┘ │
│ ✅ ENTREGUES (12)      ▾    │  ← colapsável
│ ❌ CANCELADOS (2)      ▾    │  ← colapsável
└─────────────────────────────┘
```

Mapeamento de status para grupos:
- **Novos**: `pending`, `awaiting_confirmation`, `new`, `confirmed`, `accepted`
- **Em Preparo**: `preparing`
- **Prontos**: `ready`
- **Entregues**: `delivered`, `sent_to_pdv`, `dispatched`
- **Cancelados**: `cancelled`, `error`

