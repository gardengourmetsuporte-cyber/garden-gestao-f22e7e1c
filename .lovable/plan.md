
# Plano de Melhorias Visuais e Funcionais

## Resumo das Alterações Solicitadas

1. **Persistência de ordem dos lembretes** - Quando arrastar, salvar a nova posição no banco
2. **Toggle Calendário/Lista na Agenda** - Substituir "Lembretes" por alternador de visualização
3. **Botões de transação mais vibrantes** - Melhorar visual dos botões de Receita/Despesa/Transferência
4. **Padronização visual do sistema inteiro** - Cores, espaçamentos, cards e tipografia consistentes

---

## Parte 1: Correção da Persistência de Reordenação (Agenda)

### Problema Atual
O drag-and-drop dos lembretes não persiste a nova ordem no banco. O `handleDragEnd` apenas faz console.log.

### Solução
1. Adicionar coluna `sort_order` na tabela `manager_tasks`
2. Criar mutation `reorderTasks` no hook `useAgenda.ts`
3. Implementar optimistic update no `handleDragEnd` em `Agenda.tsx`

### Arquivos Afetados
- **Migração SQL**: Nova coluna `sort_order`
- `src/hooks/useAgenda.ts`: Adicionar `reorderTasks` mutation
- `src/pages/Agenda.tsx`: Implementar lógica de reordenação

---

## Parte 2: Toggle Calendário/Lista na Agenda

### Design Proposto
Substituir o header "Lembretes" por um toggle visual:
- **Ícone de Lista** - Visualização atual (lista de lembretes)
- **Ícone de Calendário** - Nova visualização mensal

### Componentes Novos
- `src/components/agenda/AgendaCalendarView.tsx` - Visualização por calendário mostrando lembretes por data

### Arquivos Afetados
- `src/pages/Agenda.tsx`: Adicionar estado de view e toggle
- Criar componente de calendário adaptado do `ScheduleCalendar`

---

## Parte 3: Botões de Transação Mais Vibrantes (Finance)

### Problema Atual
Os botões de "Receita", "Despesa" e "Transf." em `FinanceHome.tsx` usam `variant="outline"` com cores sutis.

### Nova Aparência
```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    ↑        │  │    ↓        │  │    ↔        │
│  Receita    │  │  Despesa    │  │  Transf.    │
│ (verde)     │  │ (vermelho)  │  │  (azul)     │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Mudanças de Estilo
- Background sólido com gradiente sutil
- Ícones maiores (w-6 h-6)
- Sombra colorida (shadow-success/20, shadow-destructive/20, shadow-primary/20)
- Bordas mais definidas
- Touch targets maiores (py-4)

### Arquivos Afetados
- `src/components/finance/FinanceHome.tsx`: Redesenhar os 3 botões de ação

---

## Parte 4: Padronização Visual do Sistema

### Princípios de Design a Aplicar

| Elemento | Padrão |
|----------|--------|
| Cards | `rounded-2xl`, sombra sutil, borda `border-border` |
| Headers | Gradiente suave ou fundo sólido com ícone destacado |
| Botões primários | Sombra colorida (`shadow-lg shadow-primary/30`) |
| Espaçamentos | `gap-4` entre seções, `p-4` interno |
| Cores funcionais | Success=verde, Warning=âmbar, Destructive=vermelho, Primary=azul |

### Arquivos a Padronizar

1. **`src/index.css`** - Adicionar mais classes utilitárias unificadas
2. **`src/components/ui/button.tsx`** - Adicionar variante `success` e melhorar bordas
3. **`src/pages/Agenda.tsx`** - Aplicar classes do design system
4. **`src/pages/CashClosing.tsx`** - Padronizar header igual outros módulos
5. **`src/components/finance/FinanceHome.tsx`** - Melhorar botões de ação
6. **`src/components/finance/FinanceBottomNav.tsx`** - Adicionar sombra e destaque no FAB
7. **`src/components/agenda/TaskItem.tsx`** - Melhorar visual dos cards
8. **`src/components/agenda/CategoryChips.tsx`** - Chips mais elegantes
9. **`src/components/agenda/TaskSheet.tsx`** - Formulário padronizado

---

## Detalhes Técnicos

### Migração do Banco de Dados
```sql
-- Adicionar sort_order para persistir ordem dos lembretes
ALTER TABLE manager_tasks ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Popular sort_order inicial baseado em created_at
UPDATE manager_tasks 
SET sort_order = sub.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY due_date NULLS FIRST, created_at) as row_num 
  FROM manager_tasks
) sub 
WHERE manager_tasks.id = sub.id;
```

### Hook useAgenda - Reordenação
```typescript
const reorderTasksMutation = useMutation({
  mutationFn: async (updates: { id: string; sort_order: number }[]) => {
    const { error } = await supabase
      .from('manager_tasks')
      .upsert(updates.map(u => ({ id: u.id, sort_order: u.sort_order })));
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manager-tasks'] }),
});
```

### Toggle de View (Agenda)
```typescript
const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

// No header, substituir título por toggle:
<div className="view-toggle-group">
  <button className={viewMode === 'list' ? 'view-toggle-active' : 'view-toggle-inactive'}>
    <ListChecks /> Lista
  </button>
  <button className={viewMode === 'calendar' ? 'view-toggle-active' : 'view-toggle-inactive'}>
    <Calendar /> Calendário
  </button>
</div>
```

### Botões Vibrantes (Finance)
```typescript
// De:
<Button variant="outline" className="bg-success/10 ...">

// Para:
<button className="flex-col h-auto py-4 gap-2 rounded-2xl 
  bg-gradient-to-br from-success to-success/80 
  text-success-foreground shadow-lg shadow-success/30
  hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
  transition-all">
```

---

## Ordem de Implementação

1. Criar migração SQL para `sort_order`
2. Atualizar `useAgenda.ts` com reordenação e query ordenada por `sort_order`
3. Implementar `handleDragEnd` funcional em `Agenda.tsx`
4. Criar componente `AgendaCalendarView.tsx`
5. Adicionar toggle de visualização em `Agenda.tsx`
6. Redesenhar botões de ação em `FinanceHome.tsx`
7. Padronizar visual do `CashClosing.tsx`
8. Adicionar classes CSS globais para consistência
9. Aplicar melhorias visuais nos componentes da Agenda

---

## Resultado Esperado

- Lembretes mantêm a ordem definida pelo usuário ao arrastar
- Visualização alternável entre lista e calendário na Agenda
- Botões de transação financeira mais chamativos e intuitivos
- Interface visual consistente em todo o sistema com cores padronizadas
