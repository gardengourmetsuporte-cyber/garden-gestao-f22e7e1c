

# Plano: CRM Inteligente — Score, Segmentação, Fidelização e Dashboard

## Estado Atual
- Tabela `customers` tem: name, phone, email, origin, total_spent, total_orders, last_purchase_at, birthday, notes
- Sem score, sem segmentação, sem regras de fidelidade, sem dashboard de relacionamento
- UI é uma lista simples com 3 stats genéricos

## Mudanças no Banco de Dados

### 1. Adicionar colunas à tabela `customers`
```sql
ALTER TABLE customers ADD COLUMN segment text DEFAULT 'new';
-- segment: 'vip' | 'frequent' | 'occasional' | 'inactive' | 'new'
ALTER TABLE customers ADD COLUMN score integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN loyalty_points integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN visit_frequency_days numeric DEFAULT null;
```

### 2. Criar tabela `loyalty_rules` (regras de fidelidade por unidade)
- unit_id, rule_type ('orders_for_free' | 'points_per_real' | 'birthday_discount'), threshold, reward_value, is_active

### 3. Criar tabela `loyalty_events` (histórico de pontos/resgates)
- customer_id, unit_id, type ('earn' | 'redeem' | 'birthday_bonus'), points, description, created_at

### 4. Criar função DB `recalculate_customer_score` (trigger ou manual)
Score baseado em: recência (0-30), frequência (0-30), valor monetário (0-40) — modelo RFM simplificado. Calcula segment automaticamente.

## Mudanças no Frontend

### 5. Redesign completo da página `Customers.tsx`
- **Dashboard de Relacionamento** no topo: Total clientes, Ativos no mês, Inativos, Ticket médio, Taxa de retorno (5 cards compactos)
- **Filtro por segmento**: Chips coloridos (🟢 VIP, 🔵 Frequente, 🟡 Ocasional, 🔴 Inativo, ⚪ Novo)
- **CustomerCard redesenhado**: Badge de segmento colorido, barra de score visual, pontos de fidelidade, dias desde última compra

### 6. Novo componente `CustomerDetail` (sheet expandido)
- Ao clicar no cliente, abre detalhes com: score RFM visual, histórico de fidelidade, regras aplicáveis, ações rápidas (enviar cupom placeholder, registrar compra)

### 7. Aba de Fidelidade nas Settings (`LoyaltySettings.tsx`)
- Configurar regras: "A cada X pedidos = 1 grátis", "X pontos por R$1 gasto", "Desconto de aniversário"
- Toggle ativo/inativo por regra

### 8. Hook `useCustomerCRM` 
- Calcula stats do dashboard (ativos, inativos, ticket médio, taxa de retorno) client-side
- Gerencia loyalty_events e loyalty_rules

### 9. Atualizar tipo `Customer` 
- Adicionar segment, score, loyalty_points, visit_frequency_days

## Componentes

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar — colunas + tabelas + função score |
| `src/types/customer.ts` | Editar — novos campos |
| `src/pages/Customers.tsx` | Reescrever — dashboard + filtros + segmentos |
| `src/components/customers/CustomerCard.tsx` | Reescrever — badge segmento + score bar |
| `src/components/customers/CustomerDetail.tsx` | Criar — detalhes expandidos |
| `src/hooks/useCustomers.ts` | Editar — incluir stats + loyalty |
| `src/hooks/useCustomerCRM.ts` | Criar — stats dashboard + segmentação |
| `src/components/settings/LoyaltySettings.tsx` | Criar — regras de fidelidade |
| `src/pages/Settings.tsx` | Editar — adicionar aba Fidelidade |

## Sobre Automação (WhatsApp/cupons automáticos)
Não será implementado nesta etapa — depende de integrações externas (WhatsApp API) que já existem parcialmente no sistema. A estrutura de dados (loyalty_events, segments) preparará o terreno para automações futuras.

