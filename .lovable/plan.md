
# Plano: Corrigir Ordem dos Itens e Padronizar Design Visual

## Problema 1: Ordem dos Itens na Checklist

### Diagnóstico
Quando você edita um item na checklist, a função `updateItem` chama `fetchSectors()` que busca os dados do banco novamente. O problema é que essa busca **não ordena** subcategorias e itens pelo campo `sort_order`, fazendo com que eles apareçam em ordem aleatória.

### Solução
Adicionar ordenação por `sort_order` na query de subcategorias e itens dentro da função `fetchSectors`:

```sql
-- Antes (sem ordenação de itens)
subcategories:checklist_subcategories(*,items:checklist_items(*))

-- Depois (com ordenação)
subcategories:checklist_subcategories(*, items:checklist_items(*).order(sort_order))
  .order(sort_order)
```

---

## Problema 2: Design Visual Inconsistente

### Diagnóstico
Cada módulo foi desenvolvido com estilos diferentes:

| Módulo | Problemas Identificados |
|--------|------------------------|
| **Dashboard** | Cards com gradientes únicos, espaçamento grande |
| **Estoque** | Usa classe `stock-card` customizada, ícones menores |
| **Checklists** | Cards arredondados com bordas, visual mais moderno |
| **Recompensas** | Componentes `Card` do shadcn, estilo diferente |
| **Configurações** | Tabs sem ícones visíveis em mobile, cards básicos |

### Solução: Sistema de Design Unificado

Criar um **Design System consistente** que mantém toda a funcionalidade existente, mudando apenas a aparência visual.

#### Princípios do Novo Design

1. **Cards Padronizados**: Todos usam `rounded-2xl`, sombra suave, bordas consistentes
2. **Headers Unificados**: Mesmo estilo em todas as páginas (ícone + título + subtítulo)
3. **Cores por Função**: 
   - Ações principais: `bg-primary`
   - Sucesso/Completado: `bg-success`
   - Alerta/Atenção: `bg-warning`
   - Erro/Crítico: `bg-destructive`
4. **Touch-Targets**: Mínimo 48px para botões e áreas clicáveis
5. **Tipografia**: Hierarquia clara (título bold, subtítulo muted)

---

## Arquivos a Modificar

### Correção da Ordem (Bug Fix)
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useChecklists.ts` | Adicionar `.order('sort_order')` nas subcategorias e itens da query |

### Padronização Visual (Design System)
| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Adicionar novas classes utilitárias padronizadas |
| `src/pages/Checklists.tsx` | Atualizar header para padrão unificado |
| `src/pages/Inventory.tsx` | Atualizar header e cards para padrão unificado |
| `src/pages/Rewards.tsx` | Atualizar header para padrão unificado |
| `src/pages/Settings.tsx` | Atualizar header e tabs para padrão unificado |
| `src/components/dashboard/AdminDashboard.tsx` | Ajustar cards para padrão unificado |
| `src/components/dashboard/EmployeeDashboard.tsx` | Ajustar cards para padrão unificado |
| `src/components/inventory/StatsCard.tsx` | Atualizar para novo padrão visual |
| `src/components/rewards/ProductCard.tsx` | Atualizar para novo padrão visual |
| `src/components/checklists/ChecklistView.tsx` | Pequenos ajustes de consistência |

---

## Detalhes Técnicos

### 1. Correção da Query de Ordenação

```typescript
// src/hooks/useChecklists.ts - fetchSectors
const { data, error } = await supabase
  .from('checklist_sectors')
  .select(`
    *,
    subcategories:checklist_subcategories(
      *,
      items:checklist_items(*)
    )
  `)
  .order('sort_order')
  .order('sort_order', { referencedTable: 'checklist_subcategories' })
  .order('sort_order', { referencedTable: 'checklist_subcategories.checklist_items' });
```

### 2. Novas Classes CSS Utilitárias

```css
/* Sistema de Cards Padronizado */
.card-base {
  @apply bg-card rounded-2xl border shadow-sm;
}

.card-interactive {
  @apply card-base hover:shadow-md active:scale-[0.98] 
         transition-all cursor-pointer;
}

/* Header Padronizado */
.page-header-new {
  @apply bg-card border-b sticky top-0 lg:top-0 z-40;
}

.page-header-content {
  @apply px-4 py-4 lg:px-6;
}

/* Stats Card Padronizado */
.stats-card {
  @apply card-interactive p-4;
}
```

### 3. Padrão de Header para Todas as Páginas

```tsx
<header className="page-header-new">
  <div className="page-header-content">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Título</h1>
        <p className="text-sm text-muted-foreground">Subtítulo</p>
      </div>
    </div>
  </div>
</header>
```

---

## O Que NÃO Muda

- Toda a lógica e funcionalidade permanece igual
- Estrutura de navegação (sidebar, menu)
- Fluxos de dados e integrações com o banco
- Permissões de admin vs funcionário
- Comportamento de checklists, estoque, recompensas

---

## Resumo Visual das Mudanças

```text
┌─────────────────────────────────────────────────────────┐
│  ANTES: Design fragmentado                              │
│  ┌─────┐ ┌───────┐ ┌─────────┐ ┌───────────┐           │
│  │Dark │ │Rounded│ │Gradient │ │ Sharp     │           │
│  │Blue │ │Green  │ │Orange   │ │ Gray      │           │
│  └─────┘ └───────┘ └─────────┘ └───────────┘           │
│  Dashboard  Checklist  Rewards   Settings               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  DEPOIS: Design unificado                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Mesma estrutura de card                        │   │
│  │  Mesma tipografia                               │   │
│  │  Mesmas cores por função                        │   │
│  │  Mesmos espaçamentos                            │   │
│  └─────────────────────────────────────────────────┘   │
│  Dashboard = Checklist = Rewards = Settings             │
└─────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Familiaridade**: Usuário aprende uma vez, usa em todos os módulos
2. **Profissionalismo**: App parece uma única aplicação coesa
3. **Manutenção**: Mudanças futuras de estilo são centralizadas
4. **Acessibilidade**: Touch-targets consistentes para uso em celular
