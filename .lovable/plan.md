

## Plano: Módulo de Obrigações Legais (Compliance)

Módulo para cadastrar e acompanhar todas as obrigações legais e regulatórias do estabelecimento (alvarás, laudos do bombeiro, vigilância sanitária, detetização, etc.), com upload de documentos e alertas de vencimento.

### Banco de dados

**Nova tabela `legal_obligations`:**
- `id` uuid PK
- `unit_id` uuid FK → units
- `title` text (ex: "Laudo do Bombeiro", "Alvará de Funcionamento")
- `category` text (ex: "bombeiro", "vigilancia_sanitaria", "prefeitura", "detetizacao", "associacao", "outros")
- `description` text nullable
- `document_url` text nullable (upload do PDF/foto do laudo)
- `issue_date` date nullable (data de emissão)
- `expiry_date` date nullable (data de vencimento)
- `status` text default 'active' (active, expired, pending)
- `alert_days_before` int default 30 (quantos dias antes avisar)
- `notes` text nullable
- `created_by` uuid FK → auth.users
- `created_at`, `updated_at` timestamps

RLS: acesso restrito por `unit_id` via `user_has_unit_access`.

**Storage bucket** `legal-documents` (privado) para uploads dos laudos/documentos.

### Navegação

Adicionar item **"Obrigações"** no grupo **Gestão** em `navItems.ts`, com ícone `ShieldCheck`, rota `/compliance`.

### Página `src/pages/Compliance.tsx`

- Header com título "Obrigações Legais"
- Cards por obrigação usando o padrão premium (barra lateral colorida por categoria)
- Cada card mostra: título, categoria (badge), data de vencimento, status (verde/amarelo/vermelho conforme proximidade do vencimento), botão para ver documento
- Indicador visual: verde (>30 dias), amarelo (≤30 dias), vermelho (vencido)
- FAB para adicionar nova obrigação

### Sheet de cadastro/edição

- Campos: título, categoria (select com opções pré-definidas), descrição, data emissão, data vencimento, alerta (dias antes), upload de documento (foto/PDF)
- Upload via Storage bucket `legal-documents`

### Integração com Daily Digest

Obrigações próximas do vencimento (dentro do `alert_days_before`) serão incluídas no resumo diário existente como notificação.

### Arquivos

- `src/pages/Compliance.tsx` — página principal (novo)
- `src/components/compliance/ObligationCard.tsx` — card de obrigação (novo)
- `src/components/compliance/ObligationSheet.tsx` — formulário de cadastro/edição (novo)
- `src/hooks/useObligations.ts` — CRUD hook (novo)
- `src/lib/navItems.ts` — adicionar item de navegação
- `src/App.tsx` — adicionar rota `/compliance`
- Migration: criar tabela + bucket + RLS

