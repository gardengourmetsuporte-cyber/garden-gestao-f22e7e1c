

## Sistema de Comandas Físicas com QR Code

### Conceito
Ao finalizar o pedido no tablet, o sistema abre a câmera para escanear a comanda física. O pedido é vinculado ao número da comanda escaneada. Na hora de cobrar, todos os pedidos da mesma comanda são agrupados automaticamente.

### Fluxo do Cliente
```text
Cardápio → Carrinho → "Enviar Pedido" → Câmera abre → Escaneia comanda física → Pedido vinculado à comanda #N → Sucesso
```

### Mudanças

**1. Banco de dados**
- Adicionar coluna `comanda_number` (integer, nullable) na tabela `tablet_orders`
- Índice para agrupar pedidos por comanda

**2. Gerador de QR Codes das Comandas**
- Nova seção no admin do Cardápio Digital para gerar e imprimir QR codes das comandas 1-100
- Cada QR code contém: `{"comanda": N, "unit_id": "xxx"}`
- Layout otimizado para impressão (grid de cards com número + QR)

**3. Fluxo do Carrinho (TabletMenuCart)**
- Substituir o campo "Número da Mesa" pelo scanner de comanda
- Ao clicar "Enviar Pedido": abre a câmera usando `html5-qrcode`
- Lê o QR code da comanda → extrai o número → envia o pedido com `comanda_number` preenchido
- O `table_number` passa a ser preenchido automaticamente a partir da comanda (ou mantido como campo separado se necessário)

**4. Tela de Cobrança (TabletBill)**
- Agrupar pedidos por `comanda_number` em vez de `table_number`
- Totalizar todos os pedidos da mesma comanda para facilitar o fechamento

**5. Painel de Pedidos Pendentes**
- Cards mostram o número da comanda em destaque (ex: "Comanda #12") em vez de "Mesa 5"

### Detalhes Técnicos
- Usa `html5-qrcode` (já instalado) para o scanner no carrinho
- QR content format: `{"comanda": 12, "unit_id": "uuid"}` — validação por unit_id para segurança
- Coluna `comanda_number` convive com `table_number` (retrocompatível)
- Gerador de QR codes usa `qrcode.react` (já instalado) com CSS `@media print`

