

## Plano: Transformar "Fichas" de módulo separado em opção dentro do Modo da Venda (PDV)

### Contexto
Atualmente "Fichas" é um módulo separado (`/fichas`) que mostra pedidos vindos do tablet. O usuário quer que "Ficha" seja uma **4ª opção** no `SaleSourceSheet` (junto com Balcão, Mesa, Delivery), onde ele digita o número da ficha e opcionalmente a mesa, para lançar manualmente. O lançamento automático continua vindo do tablet/QR Code.

### Mudanças

**1. `src/components/pdv/SaleSourceSheet.tsx`**
- Adicionar `'ficha'` ao tipo `SaleSource`
- Adicionar botão "Ficha" no array `sources` com ícone `Receipt`
- Adicionar campos contextuais para `source === 'ficha'`: input de **Nº ficha** (obrigatório) e **Nº mesa** (opcional)
- Adicionar campo `fichaNumber` (number | null) ao `SaleSourceData`

**2. `src/hooks/pos/usePOSCart.ts`**
- Expandir tipo do `saleSource` para incluir `'ficha'`
- Adicionar estado `fichaNumber` com getter/setter
- Limpar `fichaNumber` no `clearCart`

**3. `src/hooks/pos/usePOSCheckout.ts`**
- Incluir `fichaNumber` nas deps
- Ao salvar a venda com `source: 'ficha'`, guardar o número da ficha no campo `notes` (formato: `Ficha: X`) e o `table_number` se preenchido

**4. `src/hooks/pos/types.ts`** e `src/hooks/usePOS.ts`
- Propagar o novo campo `fichaNumber` nas interfaces

**5. Remover módulo Fichas separado**
- Remover entrada de `src/lib/modules.ts` (key `'fichas'`)
- Remover entrada de `src/lib/navItems.ts` (href `/fichas`)
- Remover rota `/fichas` de `src/App.tsx`
- Manter o arquivo `src/pages/Fichas.tsx` por enquanto (pode ser removido depois), ou deletá-lo

**6. Visualização das fichas no PDV**
- As fichas que entram automaticamente pelo tablet já aparecem como pedidos pendentes no PDV (via `usePOSOrders`). As fichas manuais lançadas pelo operador serão vendas normais com source `'ficha'`.

### Resultado
O operador verá 4 botões no sheet de Modo da Venda: **Balcão | Mesa | Delivery | Ficha**. Ao selecionar "Ficha", aparecerão campos para número da ficha e mesa. O módulo separado de Fichas será removido da navegação.

