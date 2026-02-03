
# Plano: Redesign Visual Completo e Unificado

## Diagnóstico do Problema

Após análise detalhada, identifiquei que o aplicativo tem **múltiplos padrões visuais** que não conversam entre si:

### Inconsistências Encontradas

| Elemento | Dashboard | Estoque | Checklists | Recompensas | Configurações |
|----------|-----------|---------|------------|-------------|---------------|
| **Cards** | `Card` shadcn + gradientes | `stock-card` customizado | `rounded-2xl border` manual | `Card` shadcn | `bg-secondary/50` |
| **Cores Header** | `bg-gradient-to-br from-primary` | `bg-primary/10` | `bg-success/10` | `bg-gradient-to-br from-amber-500` | `bg-secondary` |
| **Border Radius** | `rounded-2xl` | `rounded-2xl` e `rounded-xl` misturados | `rounded-2xl` | `rounded-xl` e `rounded-2xl` | `rounded-xl` |
| **Sombras** | `shadow-lg` em alguns | `shadow-sm` | `shadow-inner` na progress | Sem sombra nos cards | Sem sombra |
| **Espaçamentos** | `p-5`, `p-6` | `p-4`, `p-3` | `p-4`, `p-5` | `p-4`, `p-6` | `p-3`, `p-4` |

---

## Solução: Design System Único e Coeso

### Princípios do Novo Design

1. **Consistência Total**: Todos os componentes usam os mesmos tokens visuais
2. **Hierarquia Clara**: Cores indicam função, não módulo
3. **Touch-Friendly**: Mínimo 48px para áreas clicáveis
4. **Profissional mas Acessível**: Visual moderno sem complexidade visual

### Tokens Visuais Unificados

| Token | Valor | Uso |
|-------|-------|-----|
| `border-radius` | `1rem` (16px) = rounded-2xl | Cards, botões grandes |
| `border-radius-sm` | `0.75rem` (12px) = rounded-xl | Ícones, elementos menores |
| `shadow-card` | `shadow-sm` | Todos os cards em repouso |
| `shadow-hover` | `shadow-md` | Cards ao passar o mouse |
| `padding-card` | `p-4` | Padrão para cards |
| `gap-items` | `gap-3` ou `gap-4` | Entre elementos |

### Paleta de Cores por Função (não por módulo)

- **Primary**: Ações principais, navegação ativa
- **Success**: Completado, entrada de estoque, checklist concluído
- **Warning**: Atenção, estoque baixo
- **Destructive**: Crítico, saída, erro
- **Amber/Orange**: Pontos, recompensas, gamificação

---

## Arquivos a Modificar

### 1. CSS Base (`src/index.css`)
- Remover classes duplicadas/conflitantes
- Criar sistema de classes unificado mais robusto
- Padronizar transições e animações

### 2. Páginas Principais
| Arquivo | Mudanças |
|---------|----------|
| `src/pages/DashboardNew.tsx` | Unificar header com mesmo padrão |
| `src/pages/Inventory.tsx` | Remover `stock-card`, usar padrão unificado |
| `src/pages/Checklists.tsx` | Ajustar espaçamentos e bordas |
| `src/pages/Rewards.tsx` | Padronizar cards de produtos |
| `src/pages/Settings.tsx` | Unificar tabs e cards internos |

### 3. Componentes de Dashboard
| Arquivo | Mudanças |
|---------|----------|
| `AdminDashboard.tsx` | Unificar MetricCard e QuickAccessCard |
| `EmployeeDashboard.tsx` | Usar mesmos padrões do Admin |
| `Leaderboard.tsx` | Usar novo padrão de card |
| `UserPointsCard.tsx` | Ajustar para padrão unificado |
| `SectorPointsSummary.tsx` | Ajustar para padrão unificado |

### 4. Componentes de Estoque
| Arquivo | Mudanças |
|---------|----------|
| `ItemCardNew.tsx` | Substituir stock-card por card-base |
| `StatsCard.tsx` | Usar novo padrão unificado |

### 5. Componentes de Recompensas
| Arquivo | Mudanças |
|---------|----------|
| `ProductCard.tsx` | Unificar com design system |
| `RedemptionHistory.tsx` | Usar padrão de lista unificado |

### 6. Componentes de Checklists
| Arquivo | Mudanças |
|---------|----------|
| `ChecklistView.tsx` | Ajustar cards de setor para padrão |

### 7. Componentes de Configurações
| Arquivo | Mudanças |
|---------|----------|
| `ProfileSettings.tsx` | Padronizar inputs e botões |
| `CategorySettings.tsx` | Usar lista padronizada |

---

## Mudanças Visuais Específicas

### Headers de Página (Todos Iguais)
```css
/* Padrão unificado para todos os headers */
.page-header-unified {
  background: var(--card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 40;
}

/* Ícone do header - cor varia por módulo mas estrutura é igual */
.page-header-icon {
  width: 2.5rem;      /* 40px */
  height: 2.5rem;     /* 40px */
  border-radius: 0.75rem; /* 12px */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Cards (Padrão Único)
```css
/* Card base - usado em TODOS os lugares */
.card-unified {
  background: var(--card);
  border-radius: 1rem;      /* 16px */
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

/* Card interativo - para itens clicáveis */
.card-unified-interactive {
  composes: card-unified;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-unified-interactive:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  border-color: hsl(var(--primary) / 0.2);
}

.card-unified-interactive:active {
  transform: scale(0.98);
}
```

### Listas de Itens (Padrão Único)
```css
/* Item de lista padrão */
.list-item-unified {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;    /* 12px 16px */
  border-radius: 0.75rem;   /* 12px */
  background: hsl(var(--secondary) / 0.5);
  transition: background 0.15s ease;
}

.list-item-unified:hover {
  background: var(--secondary);
}
```

---

## Antes vs Depois (Visual)

```
ANTES (Fragmentado)
┌──────────────────────────────────────────────────────┐
│ Dashboard: Gradientes fortes, cards com shadow-lg   │
│ Estoque: stock-card cinza, bordas finas             │
│ Checklists: Bordas médias, gradientes sutis         │
│ Recompensas: Cards shadcn padrão, pouco destaque    │
│ Configurações: Visual básico, sem personalidade     │
└──────────────────────────────────────────────────────┘

DEPOIS (Unificado)
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Mesmo padrão de header em todas as páginas │   │
│  │  Ícone 40x40 + Título + Subtítulo           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Card     │ │ Card     │ │ Card     │            │
│  │ rounded  │ │ rounded  │ │ rounded  │            │
│  │ shadow   │ │ shadow   │ │ shadow   │            │
│  │ hover    │ │ hover    │ │ hover    │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  Todos os cards seguem o mesmo padrão visual        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## O Que NÃO Muda

- Toda a lógica e funcionalidade do sistema
- Estrutura de navegação (sidebar, rotas)
- Fluxos de dados e banco de dados
- Permissões de admin vs funcionário
- Comportamento de checklists, estoque, recompensas, pontos

---

## Seção Técnica

### Novas Classes CSS Unificadas

```css
/* Adicionar ao src/index.css */

/* ========== DESIGN SYSTEM UNIFICADO ========== */

/* Cards */
.card-unified {
  @apply bg-card rounded-2xl border border-border/50 shadow-sm;
}

.card-unified-interactive {
  @apply card-unified cursor-pointer transition-all duration-200;
  @apply hover:shadow-md hover:border-primary/20;
  @apply active:scale-[0.98];
}

/* Listas */
.list-item {
  @apply flex items-center justify-between p-3 rounded-xl bg-secondary/50;
  @apply hover:bg-secondary transition-colors;
}

/* Stats/Métricas */
.stat-card {
  @apply card-unified-interactive p-4;
}

.stat-card-gradient {
  @apply rounded-2xl p-5 text-white transition-all duration-200;
  @apply hover:scale-[1.02] hover:shadow-xl active:scale-[0.98];
}

/* Seções */
.section-header {
  @apply text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3;
}

/* Badges de Status */
.badge-status {
  @apply inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold;
}

.badge-success { @apply bg-success/15 text-success; }
.badge-warning { @apply bg-warning/15 text-warning; }
.badge-error { @apply bg-destructive/15 text-destructive; }
.badge-info { @apply bg-primary/15 text-primary; }
```

### Padrão de Header Atualizado

```tsx
// Usar em TODAS as páginas
<header className="page-header-unified">
  <div className="page-header-content">
    <div className="flex items-center gap-3">
      <div className="page-header-icon bg-[COR]/10">
        <Icon className="w-5 h-5 text-[COR]" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Título</h1>
        <p className="text-sm text-muted-foreground">Subtítulo</p>
      </div>
    </div>
  </div>
</header>
```

### Migração do stock-card

```tsx
// ANTES (ItemCardNew.tsx)
<div className="stock-card w-full transition-all hover:shadow-md">

// DEPOIS
<div className="card-unified-interactive p-4">
```

---

## Ordem de Execução

1. Atualizar `src/index.css` com novas classes unificadas
2. Atualizar headers de todas as páginas
3. Atualizar componentes de Dashboard (Admin e Employee)
4. Atualizar componentes de Estoque
5. Atualizar componentes de Checklists
6. Atualizar componentes de Recompensas
7. Atualizar componentes de Configurações

---

## Resultado Esperado

Um aplicativo com **visual profissional e coeso** onde:
- O usuário reconhece instantaneamente que está no mesmo sistema
- Cores indicam função (sucesso, alerta, ação) não módulo
- Interações são previsíveis e consistentes
- Mobile-first com touch-targets adequados
- Transições suaves e feedback visual claro
