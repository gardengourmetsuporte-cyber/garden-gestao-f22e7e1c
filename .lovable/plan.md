

## Corrigir tela de cadastro de boleto e adicionar captura de foto

### Problemas identificados
1. O sheet `RegisterInvoiceAfterReceive` tem layout com espaço vazio embaixo (visualização bugada)
2. Falta a opção de tirar foto do boleto/nota para preencher automaticamente os dados

### Mudanças

**Arquivo: `src/components/inventory/RegisterInvoiceAfterReceive.tsx`**

1. **Adicionar captura de foto** -- dois botões no topo do formulário:
   - "Foto da Nota" (nota fiscal) -- para dar entrada no estoque via OCR
   - "Foto do Boleto" -- para preencher valor e vencimento automaticamente via OCR
   - Usa `<input type="file" accept="image/*" capture="environment">` para abrir câmera no mobile
   - Preview da imagem capturada com opção de remover

2. **Integrar com OCR existente** -- reutilizar o hook `useSmartReceiving` (já tem `processImage` e `uploadImage`) para:
   - Extrair valor e data de vencimento do boleto automaticamente
   - Preencher os campos do formulário com os dados extraídos
   - Armazenar a imagem no storage

3. **Corrigir layout** -- ajustar o `max-h` e padding do SheetContent para não deixar espaço vazio, e garantir que o conteúdo ocupe o espaço correto com `pb-safe` para mobile

4. **Fluxo simplificado**:
   - Usuário tira foto → OCR extrai dados → campos preenchidos automaticamente → usuário confirma/ajusta → salva
   - Se não quiser tirar foto, preenche manual normalmente (fluxo atual mantido)

### Detalhes técnicos
- Reutiliza `useSmartReceiving` para OCR (já conectado ao edge function `smart-receiving-ocr`)
- Usa `receipt-ocr` edge function para processar boleto (extrair valor + vencimento)
- Imagens salvas no bucket `smart-receiving` existente
- Botões de câmera com ícones `Camera` e `FileText`

