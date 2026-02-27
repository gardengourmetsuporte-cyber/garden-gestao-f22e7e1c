

## Plano: Botão "Cotar" no fluxo de criação de pedido

### Problema
Hoje, para fazer uma cotação, o usuário precisa ir na aba Cotações e montar tudo do zero. O ideal é que, ao criar um pedido para um fornecedor, ele tenha a opção de enviar os mesmos itens para cotação com outros fornecedores.

### Fluxo proposto

1. Na sheet "Novo Pedido" (ao clicar "Pedir" em um fornecedor), adicionar um segundo botão **"Cotar"** ao lado do "Criar Pedido"
2. Ao clicar em "Cotar", abre uma **segunda etapa** na mesma sheet onde o usuário seleciona **fornecedores adicionais** (mín. 1 extra, pois o original já está incluído)
3. Ao confirmar, o sistema cria a cotação automaticamente com:
   - O fornecedor original + os selecionados
   - Os itens e quantidades já preenchidos
   - Status `sent` (pronta para receber respostas)
4. Redireciona para a aba "Cotações"

### Mudanças técnicas

**`src/pages/Orders.tsx`**
- Adicionar estado `cotationStep` (boolean) para controlar a etapa de seleção de fornecedores extras
- Adicionar estado `extraSuppliers` (string[]) para fornecedores adicionais selecionados
- Na sheet de "Novo Pedido", adicionar botão "Cotar" (ícone Scale) com variant outline ao lado de "Criar Pedido"
- Quando `cotationStep = true`, mostrar lista de fornecedores (excluindo o atual) com chips selecionáveis
- Botão final "Iniciar Cotação" que chama `createQuotation` do hook `useQuotations`
- Importar `useQuotations` e o ícone `Scale`

**Nenhuma mudança de backend necessária** — usa o hook `useQuotations.createQuotation` que já existe.

### Layout da sheet (2 etapas)

```text
┌─────────────────────────────┐
│ Novo Pedido — Fornecedor X  │
│                             │
│ [Item 1]         [qty] [un] │
│ [Item 2]         [qty] [un] │
│                             │
│ [ Criar Pedido ]  [ Cotar ] │  ← Etapa 1
└─────────────────────────────┘

Ao clicar "Cotar":

┌─────────────────────────────┐
│ Cotação — Fornecedor X + ?  │
│                             │
│ Selecione mais fornecedores │
│ [Forn. A] [Forn. B] [Forn.C]│
│                             │
│ ← Voltar  [Iniciar Cotação] │  ← Etapa 2
└─────────────────────────────┘
```

