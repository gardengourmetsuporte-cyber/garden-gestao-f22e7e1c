

## Plano: Sistema de Importação CSV + Backup de Segurança

### Ordem de execução
1. Primeiro você cria um **backup geral** pelo sistema existente (Backups no menu Mais)
2. Depois usa a nova funcionalidade de **Importação CSV** para trazer os dados do Mobills

### O que será criado

#### 1. Edge Function: `supabase/functions/import-finance-csv/index.ts`
- Recebe: CSV em texto, `unitId`, `mode` (`historical` | `full_migration`)
- Parse do CSV (detecta UTF-16, delimitador `;`)
- Para cada linha:
  - Determina `type` pelo sinal do valor (negativo = expense, positivo = income)
  - Match case-insensitive de **Conta** com `finance_accounts` da unidade
  - Match case-insensitive de **Categoria** + **Subcategoria** com `finance_categories` (normaliza acentos)
  - Mapeia categorias de receita do Mobills (PIX, DEBITO, CREDITO, DINHEIRO, IFOOD) → subcategorias de Vendas Balcão/Delivery
  - Converte data DD/MM/YYYY → YYYY-MM-DD
- **Modo Histórico**: insere com `is_paid = false` → saldos não mudam
- **Modo Migração Completa**: insere com `is_paid = false` (evita trigger), depois faz UPDATE em batch para `is_paid = true` e recalcula saldos via SQL direto
- Retorna: `{ imported, skipped, unmatchedCategories[], unmatchedAccounts[] }`
- Validação de acesso: JWT + `user_has_unit_access`

#### 2. Componente: `src/components/finance/FinanceImportSheet.tsx`
- Sheet com:
  - Upload de arquivo CSV
  - Preview das primeiras 10 linhas com badges de match (conta/categoria)
  - **RadioGroup** para escolher modo:
    - 📋 **Somente Histórico** — "Transações ficam como não pagas. Saldos atuais não mudam."
    - 🔄 **Migração Completa** — "Transações entram como pagas. Saldos recalculados do zero."
  - Alerta amarelo no modo migração
  - Botão "Importar X transações"
  - Resultado com contagem e alertas de categorias não encontradas

#### 3. Edição: `src/components/finance/FinanceMore.tsx`
- Novo item no menu: "Importar CSV (Mobills)" com ícone Upload
- Abre o `FinanceImportSheet`

#### 4. Config: `supabase/config.toml`
- Adicionar `[functions.import-finance-csv]` com `verify_jwt = false`

### Lógica de recálculo (modo migração)
Na edge function, após inserir tudo com `is_paid = false`:
1. UPDATE batch para `is_paid = true` (trigger ajusta saldos incrementalmente)
2. Recálculo final forçado via SQL para garantir consistência

### Segurança
- Antes de importar qualquer coisa, o sistema sugere criar backup pelo menu existente
- Edge function valida JWT + pertencimento à unidade
- Soft-delete respeitado (filtro `deleted_at IS NULL`)

