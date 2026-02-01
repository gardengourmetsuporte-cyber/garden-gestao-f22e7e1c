
# Plano Unificado: Dashboard Adaptativo + Pontos por Setor

## Resumo

Este plano implementa todas as funcionalidades solicitadas:
1. **Dashboard adaptativo** - Admin ve estatisticas completas, funcionario ve gamificacao e ranking
2. **Pontos disponiveis por setor** - Visivel nos checklists e no dashboard
3. **Ranking de funcionarios** - Competicao saudavel com medalhas
4. **Alertas de estoque** - Lista simplificada para funcionarios

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Pagina unificada que detecta role e renderiza dashboard correto |
| `src/components/dashboard/AdminDashboard.tsx` | Dashboard completo para administradores |
| `src/components/dashboard/EmployeeDashboard.tsx` | Dashboard com gamificacao para funcionarios |
| `src/components/dashboard/SectorPointsSummary.tsx` | Pontos disponiveis por setor (compartilhado) |
| `src/components/dashboard/PointsRanking.tsx` | Ranking com medalhas |
| `src/components/dashboard/QuickStats.tsx` | Cards estatisticos (admin) |
| `src/components/dashboard/PendingRedemptions.tsx` | Resgates pendentes (admin) |
| `src/components/dashboard/StockAlerts.tsx` | Alertas de estoque |
| `src/components/dashboard/UserPointsCard.tsx` | Card de pontos do usuario |
| `src/hooks/useLeaderboard.ts` | Hook para ranking de todos os funcionarios |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Adicionar rota `/dashboard` |
| `src/components/layout/AppLayout.tsx` | Dashboard como primeiro item do menu (todos verao) |
| `src/components/checklists/ChecklistView.tsx` | Exibir pontos disponiveis em cada setor |

---

## Detalhes Tecnicos

### 1. Hook useLeaderboard

Busca ranking de todos os funcionarios:
- Conta checklist_completions por usuario (pontos ganhos)
- Soma reward_redemptions aprovadas/entregues (pontos gastos)
- Calcula saldo e ordena por saldo DESC
- Retorna: user_id, full_name, avatar_url, earned, spent, balance

### 2. Componentes do Dashboard

**AdminDashboard**:
- QuickStats: Total itens, estoque baixo, % checklists hoje
- PointsRanking: Ranking completo com barras de progresso
- SectorPointsSummary: Pontos por setor com progresso
- PendingRedemptions: Aprovar/recusar resgates

**EmployeeDashboard**:
- UserPointsCard: Saldo, ganhos, gastos em destaque
- PointsRanking: Ranking com destaque na posicao do usuario
- SectorPointsSummary: Pontos disponiveis por setor
- StockAlerts: Apenas lista de itens com problema (sem contagem)

### 3. Pontos por Setor no ChecklistView

Adicionar no header de cada setor:
- Badge dourado com estrela
- Texto: "X pontos disponiveis"
- Cor esmaecida quando setor completo

### 4. Navegacao

Dashboard sera primeiro item no menu, visivel para todos:
```typescript
{
  icon: LayoutDashboard,
  label: 'Dashboard',
  href: '/dashboard'
}
```

---

## Visual - Dashboard Funcionario

```text
+--------------------------------------------------+
|  Ola, Maria!                                     |
|  Seu progresso de hoje                           |
+--------------------------------------------------+

+--- Seus Pontos -----------------------------------+
|                                                   |
|          STAR  127 pontos                        |
|                                                   |
|     Ganhos: 150     Gastos: 23                   |
|                                                   |
+--------------------------------------------------+

+--- Ranking de Pontos -----------------------------+
|                                                   |
|  1. Maria Clara       STAR 127 pts   MEDALHA_OURO|
|  2. Bruno Momesso     STAR 98 pts   MEDALHA_PRATA|
|  3. Joao Santos       STAR 85 pts  MEDALHA_BRONZE|
|  4. Ana Silva         STAR 72 pts                |
|  5. Pedro Costa       STAR 45 pts       <- Voce  |
|                                                   |
+--------------------------------------------------+

+--- Pontos Disponiveis Hoje -----------------------+
|                                                   |
|  Cozinha              STAR 4 pontos    [====    ]|
|  Salao                STAR 2 pontos    [======  ]|
|  Caixa                STAR 0 pontos    [========]|
|                                                   |
|  Total: 6 pontos disponiveis                      |
|                                                   |
+--------------------------------------------------+

+--- Alertas de Estoque ----------------------------+
|                                                   |
|  ALERTA 3 itens precisam de atencao              |
|                                                   |
|  - Arroz Branco - Estoque baixo                  |
|  - Oleo de Soja - Zerado                         |
|  - Guardanapos - Estoque baixo                   |
|                                                   |
+--------------------------------------------------+
```

---

## Visual - Dashboard Admin

```text
+--------------------------------------------------+
|  Dashboard Administrativo                        |
|  Visao geral do sistema                          |
+--------------------------------------------------+

+--- Resumo Rapido ---------------------------------+
|                                                   |
|  [CAIXA 25]    [ALERTA 3]     [CHECK 85%]       |
|   Itens       Est. Baixo      Checklists        |
|                                                   |
+--------------------------------------------------+

+--- Ranking de Funcionarios -----------------------+
|                                                   |
|  1. Maria Clara    STAR 127 pts  [============= ]|
|  2. Bruno Momesso  STAR 98 pts   [==========    ]|
|  3. Joao Santos    STAR 85 pts   [=========     ]|
|                                                   |
+--------------------------------------------------+

+--- Pontos por Setor ------------------------------+
|                                                   |
|  Cozinha         STAR 4 pts   [====    ] 50%    |
|  Salao           STAR 2 pts   [======  ] 80%    |
|  Caixa           STAR 0 pts   [========] 100%   |
|                                                   |
|  Total hoje: 6 pontos                            |
|                                                   |
+--------------------------------------------------+

+--- Resgates Pendentes ----------------------------+
|                                                   |
|  PRESENTE 3 resgates aguardando                  |
|                                                   |
|  Bruno - Folga (50pts)  [APROVAR] [RECUSAR]     |
|  Maria - Sushi (30pts)  [APROVAR] [RECUSAR]     |
|                                                   |
+--------------------------------------------------+
```

---

## Ordem de Implementacao

1. Criar `src/hooks/useLeaderboard.ts`
2. Criar componentes compartilhados:
   - `SectorPointsSummary.tsx`
   - `PointsRanking.tsx`
   - `StockAlerts.tsx`
   - `UserPointsCard.tsx`
3. Criar componentes admin:
   - `QuickStats.tsx`
   - `PendingRedemptions.tsx`
4. Criar dashboards:
   - `EmployeeDashboard.tsx`
   - `AdminDashboard.tsx`
5. Criar pagina `Dashboard.tsx`
6. Atualizar `App.tsx` com rota
7. Atualizar `AppLayout.tsx` com menu
8. Atualizar `ChecklistView.tsx` com pontos por setor
