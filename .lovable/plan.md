

## Plano: Tela de Nota Fiscal com cadastro rápido de cliente

### Fluxo
1. Usuário finaliza venda com "Emitir nota fiscal" ativado
2. Após `finalizeSale` retornar o `saleId`, abre um **InvoiceSheet** (bottom sheet)
3. Nessa tela o operador pode:
   - **Cadastrar cliente rápido**: nome + telefone (mínimo). Busca por telefone se já existe
   - **Enviar nota**: via WhatsApp (link) ou apenas registrar
   - Cliente já ganha pontos de fidelidade automaticamente (trigger existente `auto_update_customer_loyalty`)
4. Se o cliente já foi identificado pelo telefone, mostra os dados e linka a venda

### Mudanças

**1. Novo componente `src/components/pdv/InvoiceSheet.tsx`**
- Bottom sheet que abre após finalização quando `emitInvoice = true`
- Campo de telefone com busca automática no banco (debounce 500ms)
  - Se encontrar cliente: mostra nome, segmento, pontos acumulados
  - Se não encontrar: formulário rápido (nome + telefone, ambos obrigatórios)
- Botão "Cadastrar e Vincular" ou "Vincular Cliente"
- Ao vincular: atualiza `pos_sales.customer_name` e `pos_sales.customer_document` com o telefone
- Chama `registrarCompra` do `customerService.ts` para incrementar dados do cliente
- Exibe resumo da nota (itens, total, forma de pagamento)
- Botão "Compartilhar via WhatsApp" que gera link `wa.me/{phone}?text=...`
- Botão "Concluir" para fechar

**2. Alteração em `src/pages/PDV.tsx`**
- Adicionar estado `invoiceData` com `{ saleId, total, emitInvoice }` 
- No `handleFinalize`: se `emitInvoice`, armazenar dados e abrir `InvoiceSheet` após sucesso
- Passar `customerName` existente como valor inicial

**3. Atualizar tipo Customer origin**
- Adicionar `'pdv'` como origin (já existe no tipo, perfeito)

### Arquivos afetados
- `src/components/pdv/InvoiceSheet.tsx` — novo componente
- `src/pages/PDV.tsx` — integrar sheet pós-venda

