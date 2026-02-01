
# Plano: Sistema de Pontos e Loja de Recompensas

## Resumo Executivo

Este plano implementa um sistema de gamificação para motivar funcionários:
- **1 tarefa completada = 1 ponto**
- Exibição do saldo atual no topo da tela
- Loja onde funcionários trocam pontos por recompensas
- Admin gerencia os produtos disponíveis na loja

---

## Fluxo Visual do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│  FUNCIONÁRIO COMPLETA TAREFA                                    │
│  [✓] Verificar estoque de carnes                                │
│      ↳ +1 ponto adicionado automaticamente                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  HEADER COM SALDO (aparece em todas as páginas)                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🌟 127 pontos                           [🛒 Loja]          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LOJA DE RECOMPENSAS                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │  🍣 Sushi     │ │  🏖️ Folga     │ │  🍔 Lanche    │         │
│  │  50 pontos    │ │  100 pontos   │ │  30 pontos    │         │
│  │  [Resgatar]   │ │  [Resgatar]   │ │  [Resgatar]   │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Banco de Dados

### Novas Tabelas

**1. `reward_products` (Produtos da Loja)**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| name | text | Nome do produto (ex: "Sushi") |
| description | text | Descrição opcional |
| points_cost | integer | Quantos pontos custa |
| image_url | text | URL da imagem (opcional) |
| is_active | boolean | Se está disponível para resgate |
| stock | integer | Quantidade disponível (null = ilimitado) |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Última atualização |

**2. `reward_redemptions` (Histórico de Resgates)**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| user_id | uuid | Quem resgatou |
| product_id | uuid | Produto resgatado |
| points_spent | integer | Pontos gastos |
| status | enum | 'pending', 'approved', 'delivered', 'cancelled' |
| notes | text | Observações do admin |
| created_at | timestamp | Data do resgate |
| updated_at | timestamp | Última atualização |

---

## Cálculo de Pontos

### Lógica de Pontuação

```
Pontos Ganhos = Tarefas completadas pelo usuário (checklist_completions)
Pontos Gastos = Soma dos resgates aprovados/entregues (reward_redemptions)
Saldo Atual = Pontos Ganhos - Pontos Gastos
```

### Regras
- **1 tarefa = 1 ponto** (independente do tipo de checklist)
- Pontos são calculados em tempo real baseado nas completions
- Se admin desmarcar uma tarefa, o ponto é removido automaticamente
- Apenas resgates com status 'approved' ou 'delivered' descontam pontos

---

## Interface do Usuário

### 1. Indicador de Pontos (Sidebar/Header)

Localização: No sidebar, abaixo do avatar do usuário

```
┌──────────────────────────────────────┐
│  👤 Bruno Momesso                    │
│  Funcionário                         │
│  ─────────────────────────────────   │
│  🌟 127 pontos        [Ver Loja →]   │
└──────────────────────────────────────┘
```

### 2. Nova Página: Loja de Recompensas

Rota: `/rewards`

```
┌──────────────────────────────────────────────────────────────┐
│  Loja de Recompensas                                         │
│  Troque seus pontos por prêmios!                             │
├──────────────────────────────────────────────────────────────┤
│  Seu saldo: 🌟 127 pontos                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │     🍣         │  │     🏖️         │  │     🍔         │  │
│  │  Rodízio      │  │  Folga Extra   │  │  Lanche no     │  │
│  │  de Sushi     │  │                │  │  Garden        │  │
│  │               │  │                │  │                │  │
│  │  50 pontos    │  │  100 pontos    │  │  30 pontos     │  │
│  │  [Resgatar]   │  │  [Resgatar]    │  │  [Resgatar]    │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Meus Resgates                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🍣 Rodízio de Sushi    │  50 pts  │  ✅ Entregue     │  │
│  │  28/01/2026             │          │                   │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  🍔 Lanche no Garden    │  30 pts  │  ⏳ Pendente     │  │
│  │  01/02/2026             │          │                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3. Painel Admin: Gerenciar Loja

Localização: Nova aba em `/settings`

```
┌──────────────────────────────────────────────────────────────┐
│  Configurações > Loja de Recompensas                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Produtos Disponíveis                    [+ Novo Produto]    │
│  ─────────────────────────────────────────────────────────   │
│  │ Nome           │ Pontos │ Estoque │ Status   │ Ações │   │
│  ├────────────────┼────────┼─────────┼──────────┼───────┤   │
│  │ Rodízio Sushi  │   50   │    ∞    │  Ativo   │  ✏️ 🗑️ │   │
│  │ Folga Extra    │  100   │    5    │  Ativo   │  ✏️ 🗑️ │   │
│  │ Lanche Garden  │   30   │    ∞    │  Ativo   │  ✏️ 🗑️ │   │
│  └────────────────┴────────┴─────────┴──────────┴───────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Resgates Pendentes                                          │
│  ─────────────────────────────────────────────────────────   │
│  │ Usuário    │ Produto        │ Data       │ Ação        │ │
│  ├────────────┼────────────────┼────────────┼─────────────┤ │
│  │ Maria      │ Folga Extra    │ 01/02/2026 │ ✅ ❌       │ │
│  │ João       │ Lanche Garden  │ 01/02/2026 │ ✅ ❌       │ │
│  └────────────┴────────────────┴────────────┴─────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Políticas de Segurança (RLS)

### reward_products
- **SELECT**: Todos autenticados podem ver produtos ativos
- **INSERT/UPDATE/DELETE**: Apenas admins

### reward_redemptions
- **SELECT**: Usuário vê apenas seus resgates; admin vê todos
- **INSERT**: Usuário pode criar resgate para si mesmo
- **UPDATE**: Apenas admin (para aprovar/entregar)
- **DELETE**: Apenas admin

---

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Rewards.tsx` | Página da loja de recompensas |
| `src/hooks/usePoints.ts` | Hook para calcular pontos do usuário |
| `src/hooks/useRewards.ts` | Hook para gerenciar produtos e resgates |
| `src/components/rewards/ProductCard.tsx` | Card de produto na loja |
| `src/components/rewards/RedemptionHistory.tsx` | Histórico de resgates |
| `src/components/rewards/PointsDisplay.tsx` | Componente de exibição de pontos |
| `src/components/settings/RewardSettings.tsx` | Painel admin para loja |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Criar tabelas + RLS |
| `src/types/database.ts` | Adicionar novos tipos |
| `src/App.tsx` | Adicionar rota /rewards |
| `src/components/layout/AppLayout.tsx` | Adicionar link para loja + exibir pontos |
| `src/pages/Settings.tsx` | Adicionar aba "Loja" para admin |

---

## Detalhes Técnicos

### Migração SQL

```sql
-- Criar enum para status de resgate
CREATE TYPE reward_status AS ENUM ('pending', 'approved', 'delivered', 'cancelled');

-- Tabela de produtos
CREATE TABLE public.reward_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  stock integer, -- null = ilimitado
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de resgates
CREATE TABLE public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES reward_products(id) ON DELETE CASCADE,
  points_spent integer NOT NULL,
  status reward_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reward_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos
CREATE POLICY "Authenticated can view active products" ON public.reward_products
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage products" ON public.reward_products
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para resgates
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update redemptions" ON public.reward_redemptions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete redemptions" ON public.reward_redemptions
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_reward_products_updated_at
  BEFORE UPDATE ON public.reward_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_redemptions_updated_at
  BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Hook usePoints

```typescript
// Cálculo de pontos
const usePoints = (userId: string) => {
  // Busca total de completions do usuário
  const { count: earnedPoints } = await supabase
    .from('checklist_completions')
    .select('*', { count: 'exact', head: true })
    .eq('completed_by', userId);

  // Busca total gasto em resgates aprovados/entregues
  const { data: redemptions } = await supabase
    .from('reward_redemptions')
    .select('points_spent')
    .eq('user_id', userId)
    .in('status', ['approved', 'delivered']);

  const spentPoints = redemptions?.reduce((sum, r) => sum + r.points_spent, 0) || 0;
  const balance = (earnedPoints || 0) - spentPoints;

  return { earnedPoints, spentPoints, balance };
};
```

---

## Benefícios do Sistema

1. **Motivação**: Funcionários ganham algo tangível por completar tarefas
2. **Gamificação**: Sistema de pontos cria engajamento e competitividade saudável
3. **Transparência**: Cada um vê claramente seus pontos e histórico
4. **Flexibilidade**: Admin controla produtos e aprova resgates
5. **Rastreabilidade**: Histórico completo de ganhos e gastos

---

## Próximos Passos (Após Aprovação)

1. Executar migração SQL para criar tabelas
2. Criar tipos TypeScript
3. Implementar hooks (usePoints, useRewards)
4. Criar componentes da loja
5. Adicionar rota e navegação
6. Implementar painel admin
7. Testar fluxo completo
