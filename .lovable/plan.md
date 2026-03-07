

## Smart Scanner Widget — "Scanner Inteligente"

### Resumo
Widget no topo do dashboard (acima do saldo financeiro) que funciona como um "portal de entrada universal": o usuário tira foto ou seleciona arquivo, a IA classifica o tipo de documento e direciona automaticamente para o módulo correto, criando os lançamentos necessários. Também identifica informações faltantes e sugere ações complementares.

### Tipos de Documento Suportados

| Documento | Ações Automáticas |
|-----------|-------------------|
| Comprovante Pix/pagamento funcionário | Lança pagamento em Funcionários + despesa no Financeiro |
| Nota Fiscal (DANFE) | Entrada de estoque + atualiza preços + provisão financeira |
| Boleto | Cria provisão de despesa + vincula fornecedor |
| Papel de saída de estoque | Lançamento em lote de saídas |
| Holerite/Contracheque | Vincula como comprovante ao pagamento do funcionário |
| Recibo genérico | Lança despesa no financeiro com categoria via IA |

### Arquitetura

```text
┌─────────────────────────────────┐
│  SmartScannerWidget (Dashboard) │  ← Botão câmera/galeria
└──────────┬──────────────────────┘
           │ foto/arquivo
           ▼
┌─────────────────────────────────┐
│  Edge Function: document-scanner│  ← Nova função
│  (Gemini 2.5 Flash - visão)    │
│  1. Classifica tipo documento   │
│  2. Extrai dados estruturados   │
│  3. Identifica lacunas          │
└──────────┬──────────────────────┘
           │ JSON classificado
           ▼
┌─────────────────────────────────┐
│  SmartScannerSheet (Review)     │
│  - Mostra dados extraídos       │
│  - Perguntas sobre lacunas      │
│  - Botão confirmar lançamento   │
└──────────┬──────────────────────┘
           │ confirmação
           ▼
┌─────────────────────────────────┐
│  Hook: useSmartScanner          │
│  - Roteamento por tipo          │
│  - Criação de registros         │
│  - Invalidação de queries       │
└─────────────────────────────────┘
```

### Implementação — Arquivos

1. **`supabase/functions/document-scanner/index.ts`** — Nova edge function
   - Recebe imagem base64
   - Usa Gemini 2.5 Flash (multimodal, mais barato) para classificar e extrair
   - Prompt unificado que identifica tipo + extrai dados + lista lacunas
   - Retorna: `{ document_type, extracted_data, missing_info[], suggested_actions[] }`

2. **`src/hooks/useSmartScanner.ts`** — Hook de orquestração
   - `scanDocument(file)` → chama edge function
   - `executeActions(scanResult, userInputs)` → roteamento por tipo:
     - `pix_receipt` → insere em `employee_payments` + `finance_transactions`
     - `invoice` → reutiliza lógica do `useSmartReceiving` existente
     - `boleto` → insere em `finance_transactions` (despesa futura)
     - `stock_exit` → insere `stock_movements` em lote
     - `payslip` → vincula URL ao pagamento existente
     - `generic_receipt` → insere em `finance_transactions` com categorização IA

3. **`src/components/dashboard/SmartScannerWidget.tsx`** — Widget visual
   - Card compacto com ícone de câmera/scanner
   - Texto: "Escanear documento"
   - Input file hidden (câmera + galeria)
   - Animação de processamento

4. **`src/components/dashboard/SmartScannerSheet.tsx`** — Sheet de revisão
   - Mostra preview da imagem
   - Badge com tipo detectado
   - Dados extraídos editáveis
   - Seção de "Informações faltantes" com perguntas
   - Seção de "Sugestões" (ex: "Falta holerite do pagamento de Maria")
   - Botão confirmar que executa as ações

5. **`src/components/dashboard/AdminDashboard.tsx`** — Integração
   - Widget posicionado acima do grid de widgets (entre SetupChecklist e o grid)
   - Full-width, sempre visível

6. **`supabase/config.toml`** — Registro da nova função (verify_jwt = false)

### Fluxo do Usuário

1. Toca no widget "Escanear documento" no dashboard
2. Escolhe câmera ou galeria
3. Sistema processa com IA (loading com shimmer)
4. Sheet abre mostrando: tipo detectado, dados extraídos, perguntas sobre lacunas
5. Usuário revisa, responde perguntas e confirma
6. Sistema cria todos os registros automaticamente e mostra resumo

### Detalhes Técnicos

- **Modelo IA**: `google/gemini-2.5-flash` (multimodal, custo-benefício)
- **Contexto enviado à IA**: lista de funcionários, categorias financeiras, itens de estoque, fornecedores da unidade — para matching preciso
- **Lacunas inteligentes**: A IA retorna `missing_info` com campos como "employee_id não identificado" ou "categoria financeira ambígua", que viram perguntas no Sheet
- **Reutilização**: Aproveita lógica existente do `useSmartReceiving` para notas fiscais e do `useFinanceCategorize` para categorização

