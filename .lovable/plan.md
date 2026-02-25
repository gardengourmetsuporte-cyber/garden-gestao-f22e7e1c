

# Cotacao Self-Service — Link Publico para Fornecedores

## Problema
Voce manda o mesmo pedido pra PXT e Mega G, espera resposta de cada um, compara item a item manualmente e separa o pedido. Processo lento e repetitivo.

## Solucao
Criar um **link publico** que voce envia pro fornecedor (via WhatsApp ou qualquer meio). O fornecedor abre o link no celular, ve a lista de itens, preenche os precos e pode ate sugerir marcas alternativas. O sistema compara automaticamente e gera os pedidos otimizados com 1 toque.

```text
Fluxo:
1. Voce cria uma cotacao selecionando itens + fornecedores (PXT, Mega G)
2. Sistema gera um link unico por fornecedor (token publico, sem login)
3. Voce manda o link via WhatsApp
4. Fornecedor abre, preenche precos e marcas
5. Sistema mostra comparacao lado-a-lado em tempo real
6. Voce pode abrir rodada de contestacao (fornecedor ve que perdeu itens)
7. Com 1 toque, gera pedidos separados pro mais barato em cada item
```

## Tela do Fornecedor (pagina publica)

```text
┌──────────────────────────────────┐
│  🏪 Cotacao - Garden Gestao      │
│  Prazo: ate 15/03/2026           │
├──────────────────────────────────┤
│                                  │
│  Tomate kg       ×20             │
│  Preco/kg: [R$ ____]            │
│  Marca:    [__________]          │
│                                  │
│  Cebola kg       ×15             │
│  Preco/kg: [R$ ____]            │
│  Marca:    [__________]          │
│                                  │
│  Obs geral: [__________]        │
│                                  │
│  [Enviar Cotacao]                │
└──────────────────────────────────┘
```

## Tela de Comparacao (admin)

```text
┌──────────────────────────────────────┐
│ Item           │ PXT    │ Mega G     │
├──────────────────────────────────────┤
│ Tomate kg      │ 8,50 🏆│ 9,20       │
│   marca        │ Fugini │ Cica       │
│ Cebola kg      │ 6,00   │ 5,40 🏆    │
│ Alface un      │ 3,50   │  —  ⏳     │
├──────────────────────────────────────┤
│ Economia:         R$ 23,40           │
│ [Contestar]  [Gerar Pedidos]         │
└──────────────────────────────────────┘
```

## Detalhes Tecnicos

### Novas Tabelas (migracao SQL)

**`quotations`** — cotacao principal
- `id uuid PK`, `user_id`, `unit_id`, `title text`, `status` (draft/sent/comparing/contested/resolved), `deadline timestamptz`, `notes`, `created_at`, `resolved_at`

**`quotation_suppliers`** — fornecedores convidados
- `id uuid PK`, `quotation_id FK`, `supplier_id FK`, `token uuid UNIQUE DEFAULT gen_random_uuid()` (link publico), `status` (pending/responded/contested), `responded_at`, `notes text`

**`quotation_items`** — itens sendo cotados
- `id uuid PK`, `quotation_id FK`, `item_id FK`, `quantity numeric`, `winner_supplier_id FK nullable`

**`quotation_prices`** — precos preenchidos pelos fornecedores
- `id uuid PK`, `quotation_item_id FK`, `quotation_supplier_id FK`, `unit_price numeric`, `brand text nullable`, `notes text nullable`, `round int DEFAULT 1`, `created_at`

### RLS
- `quotations`, `quotation_items`: `user_has_unit_access` para admin
- `quotation_suppliers`, `quotation_prices`: politicas separadas — admin pode tudo, e uma politica para acesso publico via token (INSERT/UPDATE na `quotation_prices` onde o `quotation_supplier_id` corresponde ao token do request)

### Pagina Publica (sem auth)
- Rota: `/cotacao/:token`
- Busca `quotation_suppliers` pelo token, carrega os itens
- Fornecedor preenche precos e marcas, submete
- Usa `supabase.from().select/insert` com anon key (RLS valida pelo token)

### Edge Function: `quotation-public`
- Recebe token, valida, retorna itens da cotacao
- Aceita POST com precos preenchidos
- Nao requer JWT (acesso publico com token)

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useQuotations.ts` | CRUD cotacoes, logica de comparacao, geracao de pedidos otimizados |
| `src/components/orders/QuotationList.tsx` | Lista de cotacoes com status |
| `src/components/orders/QuotationSheet.tsx` | Criar nova cotacao (selecionar itens + fornecedores) |
| `src/components/orders/QuotationDetail.tsx` | Comparacao side-by-side com badges de vencedor |
| `src/pages/QuotationPublic.tsx` | Pagina publica para fornecedor preencher precos |
| `supabase/functions/quotation-public/index.ts` | Edge function para acesso publico seguro |

### Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Orders.tsx` | Nova aba "Cotacoes" no AnimatedTabs |
| `src/types/database.ts` | Tipos Quotation, QuotationSupplier, QuotationItem, QuotationPrice |
| `src/App.tsx` | Rota publica `/cotacao/:token` |

### Logica de Comparacao e Geracao de Pedidos
- Para cada item, identifica o menor `unit_price` entre fornecedores que responderam
- Em empate, mantém fornecedor atual do item (se houver)
- Agrupa itens vencedores por fornecedor
- Chama `createOrder` existente para cada grupo
- Calcula economia total (soma dos precos mais caros - soma dos vencedores)

### Contestacao
- Admin clica "Contestar" para fornecedor mais caro
- Sistema atualiza status para `contested` e incrementa `round`
- Fornecedor recebe novo link ou reabre o mesmo e ve quais itens perdeu (sem ver preco do concorrente)
- Pode submeter novos precos (round 2+)

### Mensagem WhatsApp (gerada automaticamente)
```
Ola! Temos uma cotacao de precos para voce:

📋 8 itens para cotar
⏰ Prazo: 15/03/2026

Acesse e preencha seus precos:
https://garden-gestao.lovable.app/cotacao/abc123-token

Obrigado!
```

