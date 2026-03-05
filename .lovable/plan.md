

## Sistema de Lançamento por Comprovante com Web Share Target

O usuário quer duas formas de enviar comprovantes:
1. **Compartilhar direto do app do banco** → abre o Garden automaticamente com a imagem
2. **Tirar foto ou escolher da galeria** dentro do próprio módulo financeiro

### Arquitetura

```text
App do Banco → "Compartilhar" → Garden (PWA Share Target)
                                    ↓
                              /share-receipt (rota)
                                    ↓
                         Redireciona para /finance?receipt=shared
                                    ↓
                         ReceiptOCRSheet abre automaticamente
                                    ↓
                    Edge Function receipt-ocr (Gemini Flash)
                                    ↓
                         Dados extraídos + confirmação rápida
                                    ↓
                         Transação criada no financeiro
```

### Componentes a Criar/Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `supabase/functions/receipt-ocr/index.ts` | Edge function que recebe imagem base64, usa Gemini Flash para extrair valor, data, beneficiário, tipo |
| Criar | `src/components/finance/ReceiptOCRSheet.tsx` | Sheet com 2 etapas: captura de imagem + card de confirmação com dados pré-preenchidos |
| Criar | `src/pages/ShareReceiptHandler.tsx` | Página que recebe o POST do Share Target, guarda a imagem em memória e redireciona para `/finance?receipt=shared` |
| Modificar | `vite.config.ts` | Adicionar `share_target` no manifest PWA para receber imagens compartilhadas |
| Modificar | `src/App.tsx` | Adicionar rota `/share-receipt` |
| Modificar | `src/pages/Finance.tsx` | Detectar `?receipt=shared`, abrir `ReceiptOCRSheet`; adicionar botão de câmera no FAB menu |
| Modificar | `src/pages/PersonalFinance.tsx` | Mesma integração do receipt sheet |
| Modificar | `src/components/finance/FinanceBottomNav.tsx` | Adicionar botão "Comprovante" (ícone câmera) no menu FAB expandido |

### Detalhes Técnicos

**Web Share Target (manifest)**:
```json
"share_target": {
  "action": "/share-receipt",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "files": [{ "name": "receipt", "accept": ["image/*"] }]
  }
}
```

**Service Worker**: Intercepta o POST em `/share-receipt`, salva a imagem no Cache Storage e redireciona para `/finance?receipt=shared`. O React lê do cache ao montar.

**Edge Function `receipt-ocr`**: Usa `google/gemini-2.5-flash` via Lovable AI (sem API key) com tool calling para extrair JSON estruturado: `amount`, `date`, `description`, `suggested_type`, `suggested_category_name`.

**ReceiptOCRSheet**: 
- Etapa 1: Input file (câmera/galeria) + loading animado
- Etapa 2: Card de confirmação com valor, descrição, data, tipo, categoria, conta — tudo editável inline
- Botão "Lançar" cria a transação via `addTransaction` existente
- `is_paid = true` sempre (é comprovante)

**FAB expandido**: Novo quarto botão "Comprovante" com ícone `Camera` ao lado de Receita/Despesa/Transferência.

