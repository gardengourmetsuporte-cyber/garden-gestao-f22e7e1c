

# Central Financeira Recorrente — Plano de Implementação

## Visão Geral

Novo módulo premium (plano **Business**) acessível via `/subscriptions`, que permite gerenciar assinaturas, contas fixas e gastos recorrentes em um painel centralizado com alertas e ações rápidas.

---

## 1. Banco de Dados

Nova tabela `recurring_subscriptions`:

```sql
CREATE TABLE public.recurring_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  type text NOT NULL DEFAULT 'assinatura', -- 'assinatura' | 'conta_fixa'
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'mensal', -- 'mensal' | 'anual' | 'semanal'
  next_payment_date date,
  status text NOT NULL DEFAULT 'ativo', -- 'ativo' | 'pausado' | 'cancelado'
  management_url text,
  notes text,
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

- RLS: filtro por `unit_id` via `user_has_unit_access`
- Realtime habilitado para atualizações em tempo real

---

## 2. Navegação e Acesso

- **Rota**: `/subscriptions`
- **navItems.ts**: Novo item no grupo `gestao` com ícone `RefreshCw` e label "Central Recorrente", `adminOnly: true`
- **modules.ts**: Novo módulo `subscriptions` com children para view/create/manage
- **plans.ts**: `subscriptions: 'business'`
- **App.tsx**: Nova `<Route>` protegida

---

## 3. Página Principal (`src/pages/Subscriptions.tsx`)

Página com abas internas (bottom nav ou tabs no topo):

### Aba Dashboard
- **Cards resumo**: Total mensal recorrente, Serviços ativos, Cobranças próximas (7 dias), Variação mensal estimada
- **Lista "Próximas cobranças"**: Cards com badges coloridos (Hoje=vermelho, Amanhã=laranja, Em breve=amarelo)
- **Insights**: Frases contextuais baseadas nos dados ("X assinaturas ativas", "Economize R$ X")

### Aba Assinaturas
- Grid de cards interativos com: nome, categoria (tag), valor, ciclo, próxima cobrança, status
- Ações por card: Editar, Pausar/Reativar, Cancelar (modal de confirmação com opção de abrir `management_url`), Gerenciar (link externo)
- Cancelados com opacidade reduzida

### Aba Contas Fixas
- Mesmo layout, filtrado por `type = 'conta_fixa'` com visual diferenciado (ícone/tag distintos)

### Aba Alertas
- Lista agrupada por urgência (Atrasado, Hoje, Amanhã, Em breve)
- Badge com contagem no ícone de sino do header

---

## 4. Componentes

```text
src/pages/Subscriptions.tsx          — Página principal com tabs
src/hooks/useSubscriptions.ts        — CRUD + queries + cálculos
src/components/subscriptions/
  ├── SubscriptionDashboard.tsx      — Cards + insights + próximas cobranças
  ├── SubscriptionList.tsx           — Grid de cards (assinaturas ou contas)
  ├── SubscriptionCard.tsx           — Card individual com ações
  ├── SubscriptionSheet.tsx          — Sheet de criar/editar
  ├── SubscriptionAlerts.tsx         — Painel de alertas
  ├── SubscriptionFilters.tsx        — Filtros (categoria, status, tipo, busca)
  └── CancelSubscriptionDialog.tsx   — Modal de confirmação de cancelamento
```

---

## 5. Regras de Negócio

- **Conversão anual → mensal**: `price / 12` para totalização
- **Total recorrente**: soma apenas `status = 'ativo'`
- **Alertas**: gerados client-side comparando `next_payment_date` com hoje
- **Pausado**: não gera alerta, continua no cálculo
- **Cancelado**: não entra no cálculo nem gera alerta, exibido com opacidade

---

## 6. Design

- Segue o design system existente do Garden (dark mode, cards `bg-card`, gradientes premium)
- Cards com `finance-hero-card` style para o dashboard
- Microinterações: hover com elevação, transições suaves, badges coloridos
- Responsivo para mobile (390px viewport)

---

## 7. Categorias Pré-definidas

Streaming, Software, Cloud, Alimentação, Transporte, Telefonia, Internet, Seguros, Energia, Água, Aluguel, Academia, Outros

---

## Arquivos a Criar/Modificar

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/Subscriptions.tsx` |
| Criar | `src/hooks/useSubscriptions.ts` |
| Criar | `src/components/subscriptions/*.tsx` (7 arquivos) |
| Modificar | `src/lib/navItems.ts` — adicionar item |
| Modificar | `src/lib/modules.ts` — adicionar módulo |
| Modificar | `src/lib/plans.ts` — adicionar restrição business |
| Modificar | `src/App.tsx` — adicionar rota |
| Migração SQL | Criar tabela + RLS policies |

