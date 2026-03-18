

## Módulo Freelancers / Candidatos

### Objetivo
Criar um módulo para gerenciar freelancers disponíveis para trabalho avulso, organizados por setor (Cozinha, Entregador, Salão, etc.), com envio rápido de mensagens individuais ou em massa via WhatsApp.

### Banco de Dados

**Nova tabela `freelancers`:**
- `id` (uuid, PK)
- `unit_id` (uuid, FK → units, NOT NULL)
- `name` (text, NOT NULL)
- `phone` (text, NOT NULL)
- `sector` (text, NOT NULL) — ex: "cozinha", "entregador", "salao"
- `notes` (text, nullable)
- `is_active` (boolean, default true)
- `avatar_url` (text, nullable)
- `created_at`, `updated_at` (timestamps)

RLS: filtro por `user_has_unit_access(auth.uid(), unit_id)` para SELECT/INSERT/UPDATE/DELETE.

### Frontend

1. **Nova página `src/pages/Freelancers.tsx`** — seguindo o padrão de Customers:
   - Filtro por setor (chips: Todos, Cozinha, Salão, Entregador, Outros)
   - Busca por nome/telefone
   - Lista de cards com nome, telefone, setor e botão WhatsApp direto
   - FAB para adicionar novo freelancer

2. **Componentes:**
   - `FreelancerCard` — card com nome, setor (badge colorido), telefone, botão de mensagem
   - `FreelancerSheet` — formulário para criar/editar (nome, telefone, setor, observações)
   - `FreelancerBroadcastSheet` — envio em massa: campo de mensagem com variáveis (nome, valor do dia, horário), seleção por setor ou individual, abre links `wa.me` para cada contato

3. **Hook `useFreelancers`** — CRUD padrão com filtro por `unit_id`

4. **Envio de mensagens:**
   - Individual: abre `https://wa.me/{phone}?text={mensagem}` diretamente
   - Em massa: sheet com template de mensagem (ex: "Oi {nome}, temos vaga hoje para {setor}. Valor: R${valor}. Horário: {horário}. Interesse?"), itera e abre links ou envia via Evolution API se configurado

### Navegação

- Adicionar item no `navItems.ts` no grupo "pessoas": `{ icon: 'UserPlus', label: 'Freelancers', href: '/freelancers', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' }`
- Adicionar rota protegida em `App.tsx`
- Adicionar módulo `freelancers` nos access levels do `auto_provision_unit`

### Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Migração | Nova tabela `freelancers` + RLS |
| Criar | `src/pages/Freelancers.tsx` |
| Criar | `src/components/freelancers/FreelancerCard.tsx` |
| Criar | `src/components/freelancers/FreelancerSheet.tsx` |
| Criar | `src/components/freelancers/FreelancerBroadcastSheet.tsx` |
| Criar | `src/hooks/useFreelancers.ts` |
| Editar | `src/lib/navItems.ts` — novo item |
| Editar | `src/App.tsx` — nova rota |

