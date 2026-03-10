

## Análise

O campo `unit_type` já existe em cada item do inventário (valores: `unidade`, `kg`, `litro`). Ele já é retornado pela edge function `quotation-public` e exibido na tela pública da cotação, mas de forma discreta — apenas no texto pequeno "×5 kg" e no label "Preço/kg".

O fornecedor quer ver de forma mais clara e destacada se o preço é por **unidade** ou por **kg** (ou litro).

## Plano

### Mudança na tela pública (`src/pages/QuotationPublic.tsx`)

Tornar o tipo de unidade visualmente proeminente em cada card de item:

1. **Badge de unidade destacado** — Adicionar um chip/tag colorido ao lado do nome do item mostrando "POR KG", "POR UNIDADE" ou "POR LITRO" em destaque, para o fornecedor saber exatamente o que está cotando.

2. **Label do campo de preço mais explícito** — Mudar de "Preço/kg" para algo como "💰 Preço por KG (R$)" com mais destaque visual.

3. **Tabela de comparação no painel interno** (`src/components/orders/QuotationDetail.tsx`) — Exibir a unidade de medida junto ao nome do item na coluna, para o gestor também ver claramente.

### Escopo de arquivos

- `src/pages/QuotationPublic.tsx` — Badge de unidade + label de preço mais claro
- `src/components/orders/QuotationDetail.tsx` — Exibir unit_type na tabela de comparação

Nenhuma mudança de banco de dados necessária — o campo já existe e é retornado corretamente.

