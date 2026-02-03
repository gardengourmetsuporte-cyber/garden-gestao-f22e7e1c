
# Plano: Marcar Tarefa como "Já Pronta" Sem Contar Pontos

## Problema Identificado

Algumas tarefas de checklist representam processos que se estendem de um dia para outro (ex: fazer blue cheese, descongelar carne). Quando o funcionário chega no dia seguinte, a tarefa já está concluída - mas ao marcar como "pronta", ele ganha 1 ponto sem ter feito nada naquele dia.

**Exemplo:**
- Dia 1: Funcionário A prepara o blue cheese
- Dia 2: Funcionário B chega e marca "blue cheese pronto" → ganha ponto indevidamente

---

## Solucao Proposta

Adicionar uma segunda opcao de conclusão: **"Já estava pronto"**

Ao clicar em uma tarefa, aparecerá um menu com duas opções:
1. **Concluí** - Eu fiz essa tarefa agora (ganha ponto + animação de moeda)
2. **Já estava pronto** - Apenas confirmando que está feito (sem ponto)

```
┌────────────────────────────────────────────┐
│  Blue Cheese                          ⭐+1 │
│  ─────────────────────────────────────     │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  ✓  Concluí agora (+1 ponto)       │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  ✓  Já estava pronto (sem ponto)   │    │
│  └────────────────────────────────────┘    │
│                                            │
└────────────────────────────────────────────┘
```

---

## Visual na Lista de Tarefas

Após marcada, a tarefa mostrará visualmente se foi concluída com ou sem ponto:

| Estado | Visual |
|--------|--------|
| Concluída com ponto | ✅ Verde + "João às 08:30" + ⭐+1 |
| Já estava pronto | ✅ Cinza/Azul + "João às 08:30" + 🔄 (ícone de pronto) |

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| **Banco de Dados** | Adicionar coluna `awarded_points` (boolean) na tabela `checklist_completions` |
| `src/hooks/useChecklists.ts` | Modificar `toggleCompletion` para aceitar parâmetro `awardPoints` |
| `src/hooks/usePoints.ts` | Contar apenas completions onde `awarded_points = true` |
| `src/components/checklists/ChecklistView.tsx` | Adicionar menu de opções ao clicar em tarefa |
| `src/types/database.ts` | Atualizar interface `ChecklistCompletion` |

---

## Secao Tecnica

### Migracao do Banco de Dados

```sql
-- Adicionar coluna para indicar se a conclusão gerou pontos
ALTER TABLE checklist_completions 
ADD COLUMN awarded_points boolean NOT NULL DEFAULT true;

-- Índice para performance na query de pontos
CREATE INDEX idx_completions_awarded_points 
ON checklist_completions(completed_by, awarded_points) 
WHERE awarded_points = true;
```

### Atualizar Hook useChecklists.ts

```typescript
const toggleCompletion = useCallback(async (
  itemId: string,
  checklistType: ChecklistType,
  date: string,
  isAdmin?: boolean,
  awardPoints: boolean = true  // Novo parâmetro
) => {
  // ... validações existentes ...

  if (!existing) {
    // Add completion with awarded_points flag
    const { data, error } = await supabase
      .from('checklist_completions')
      .insert({
        item_id: itemId,
        checklist_type: checklistType,
        completed_by: user?.id,
        date,
        awarded_points: awardPoints,  // Novo campo
      })
      .select()
      .single();
    // ...
  }
}, [completions, user?.id]);
```

### Atualizar Hook usePoints.ts

```typescript
async function fetchPoints() {
  // Count only completions that awarded points
  const { count: earnedPoints } = await supabase
    .from('checklist_completions')
    .select('*', { count: 'exact', head: true })
    .eq('completed_by', user.id)
    .eq('awarded_points', true);  // Filtrar apenas com pontos
  // ...
}
```

### Menu de Opcoes no ChecklistView.tsx

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Dentro do componente de item:
const [openPopover, setOpenPopover] = useState<string | null>(null);

const handleComplete = (itemId: string, awardPoints: boolean, e: React.MouseEvent) => {
  if (awardPoints) {
    // Trigger coin animation
    const rect = e.currentTarget.getBoundingClientRect();
    triggerCoin(rect.right - 40, rect.top);
  }
  onToggleItem(itemId, awardPoints, e);
  setOpenPopover(null);
};

// Render do item com Popover
<Popover open={openPopover === item.id} onOpenChange={(open) => setOpenPopover(open ? item.id : null)}>
  <PopoverTrigger asChild>
    <button className="...">
      {/* Checkbox visual */}
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-64 p-2">
    <div className="space-y-1">
      <button
        onClick={(e) => handleComplete(item.id, true, e)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-success/10 text-left"
      >
        <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
          <Check className="w-4 h-4 text-success" />
        </div>
        <div>
          <p className="font-medium text-success">Concluí agora</p>
          <p className="text-xs text-muted-foreground">Ganhar +1 ponto</p>
        </div>
      </button>
      <button
        onClick={(e) => handleComplete(item.id, false, e)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-left"
      >
        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Já estava pronto</p>
          <p className="text-xs text-muted-foreground">Sem ponto</p>
        </div>
      </button>
    </div>
  </PopoverContent>
</Popover>
```

### Indicador Visual de Tipo de Conclusao

```tsx
// Mostrar ícone diferente se não gerou ponto
{completed && (
  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
    <User className="w-3 h-3" />
    <span>
      {completion.profile?.full_name || 'Usuário'} às{' '}
      {format(new Date(completion.completed_at), 'HH:mm')}
    </span>
    {!completion.awarded_points && (
      <span className="text-blue-500 ml-1">(já pronto)</span>
    )}
  </div>
)}

// Badge mostra estado diferente se não teve ponto
<div className={cn(
  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
  completed && !completion?.awarded_points
    ? "bg-blue-500/10 text-blue-500"  // Já estava pronto
    : completed 
      ? "bg-amber-500/10 text-amber-500/50"  // Completou com ponto
      : "bg-amber-500/20 text-amber-600"  // Não completou ainda
)}>
  {completed && !completion?.awarded_points ? (
    <>
      <RefreshCw className="w-3 h-3" />
      <span>pronto</span>
    </>
  ) : (
    <>
      <Star className={cn("w-3 h-3", completed ? "fill-amber-500/50" : "fill-amber-500")} />
      <span>+1</span>
    </>
  )}
</div>
```

---

## Ordem de Execucao

1. **Migração do banco** - Adicionar coluna `awarded_points`
2. **Atualizar tipos** - Adicionar campo na interface `ChecklistCompletion`
3. **Atualizar hook de checklists** - Aceitar parâmetro `awardPoints`
4. **Atualizar hook de pontos** - Filtrar por `awarded_points = true`
5. **Atualizar ChecklistView** - Menu popover com duas opções
6. **Atualizar página Checklists** - Passar novo parâmetro

---

## Resultado Esperado

- Ao clicar em tarefa, menu aparece com duas opções
- "Concluí agora" marca tarefa + adiciona ponto + animação de moeda
- "Já estava pronto" marca tarefa sem adicionar ponto
- Visual diferenciado para tarefas marcadas sem ponto
- Contagem de pontos considera apenas tarefas com `awarded_points = true`
- Funcionários não ganham pontos indevidos por tarefas já prontas
