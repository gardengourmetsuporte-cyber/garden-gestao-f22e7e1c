
# Plano: Pontos por Setor + Dashboard Admin

## Resumo

Este plano implementa duas funcionalidades:
1. **Pontos disponíveis por setor**: Mostrar quantos pontos podem ser ganhos em cada categoria (ex: "Cozinha: 3 pontos disponíveis")
2. **Dashboard Admin**: Novo módulo exclusivo para administradores que será a primeira opção na navegação

---

## Parte 1: Pontos Disponíveis por Setor

### Visual Proposto

```text
┌─────────────────────────────────────────────────────────────┐
│  Checklist de Abertura                                      │
│  Segunda-feira, 3 de fevereiro                    85%       │
│  ████████████████████░░░░                    17/20 itens    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  Cozinha                                      │
│  │   🍳     │  4/8 concluídos                               │
│  │          │  ⭐ 4 pontos disponíveis        ████░░░░  ▼   │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  Salão                                        │
│  │   🍽️     │  8/10 concluídos                              │
│  │          │  ⭐ 2 pontos disponíveis        ██████░░  ▼   │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  Caixa                      ✓ COMPLETO        │
│  │   💳     │  5/5 concluídos                               │
│  │          │  ⭐ 0 pontos disponíveis        ████████  ▼   │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

### Lógica

- **Pontos disponíveis** = Total de itens ativos no setor - Itens já completados
- Se todos completados, mostra "0 pontos disponíveis" com estilo esmaecido
- Badge dourado com ícone de estrela para destaque

---

## Parte 2: Dashboard Admin

### Navegação

O Dashboard Admin será a primeira opção no menu, visível apenas para administradores:

```text
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard          ← NOVO (primeiro, só para admin)    │
├─────────────────────────────────────────────────────────────┤
│  📦 Estoque                                                 │
│  ✅ Checklists                                              │
│  🎁 Recompensas                                             │
│  ⚙️ Configurações                                           │
└─────────────────────────────────────────────────────────────┘
```

### Conteúdo do Dashboard

```text
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Administrativo                                   │
│  Visão geral do sistema                                     │
└─────────────────────────────────────────────────────────────┘

┌──── Resumo Rápido ─────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 📦 25      │ │ ⚠️ 3        │ │ ✅ 85%      │           │
│  │ Itens      │ │ Est. Baixo  │ │ Checklists  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌──── Pontos Disponíveis por Setor ──────────────────────────┐
│                                                             │
│  Cozinha                                      ⭐ 4 pontos   │
│  ████████████░░░░░░░░                              50%      │
│                                                             │
│  Salão                                        ⭐ 2 pontos   │
│  ██████████████████░░                              80%      │
│                                                             │
│  Caixa                                        ⭐ 0 pontos   │
│  ████████████████████                              100%     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Total disponível hoje: ⭐ 6 pontos                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌──── Resgates Pendentes ────────────────────────────────────┐
│                                                             │
│  🎁 3 resgates aguardando aprovação                        │
│                                                             │
│  • Bruno Momesso - Folga (50 pts)      [Aprovar] [Recusar] │
│  • Maria Silva - Sushi (30 pts)        [Aprovar] [Recusar] │
│  • João Santos - Lanche (15 pts)       [Aprovar] [Recusar] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/AdminDashboard.tsx` | Página do dashboard administrativo |
| `src/components/dashboard/SectorPointsSummary.tsx` | Componente com resumo de pontos por setor |
| `src/components/dashboard/QuickStats.tsx` | Cards de estatísticas rápidas |
| `src/components/dashboard/PendingRedemptions.tsx` | Lista de resgates pendentes |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionar rota /dashboard (admin only) |
| `src/components/layout/AppLayout.tsx` | Adicionar Dashboard como primeiro item (adminOnly) |
| `src/components/checklists/ChecklistView.tsx` | Exibir pontos disponíveis em cada setor |
| `src/hooks/useChecklists.ts` | Adicionar função para calcular pontos disponíveis por setor |

---

## Implementacao Tecnica

### 1. ChecklistView - Pontos por Setor

Adicionar no header de cada setor:
- Calcular: `pontosDisponiveis = total - completados`
- Exibir badge com estrela e texto "X pontos disponíveis"
- Usar cores amber para destaque

### 2. AdminDashboard

- Rota: `/dashboard`
- Acesso: Apenas administradores
- Componentes:
  - QuickStats: Total itens, estoque baixo, % checklists hoje
  - SectorPointsSummary: Pontos disponíveis por setor com progresso
  - PendingRedemptions: Lista de resgates para aprovar/recusar

### 3. Navegacao

Atualizar navItems no AppLayout:
```typescript
const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    adminOnly: true  // ← Novo, primeiro da lista
  },
  {
    icon: Package,
    label: 'Estoque',
    href: '/'
  },
  // ... resto
];
```

---

## Beneficios

| Funcionalidade | Beneficio |
|----------------|-----------|
| Pontos por setor | Funcionarios sabem quanto podem ganhar em cada area |
| Dashboard Admin | Visao consolidada para gestores tomarem decisoes |
| Resgates no dashboard | Aprovacao rapida sem navegar ate configuracoes |
