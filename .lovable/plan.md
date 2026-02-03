
# Plano: Separar Tarefas por Tipo e Adicionar Recuperação de Exclusões

## Problema Atual

Conforme mostrado na imagem, todos os itens de checklist (Abertura e Fechamento) aparecem misturados na mesma lista de configuração. Isso dificulta:
- Visualizar quais tarefas pertencem a cada tipo
- Gerenciar as tarefas de forma organizada
- Evitar erros ao atribuir o tipo errado

Além disso, não existe forma de recuperar itens excluídos por engano.

---

## Solução Proposta

### 1. Separar Tarefas com Abas

Adicionar um seletor de tipo (Abertura/Fechamento) no topo da tela de configuração de itens, similar ao que já existe na tela de execução dos checklists:

```
┌─────────────────────────────────────────────────────┐
│  Configurar Checklists                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   ☀ Abertura     │  │   ☽ Fechamento   │        │
│  └──────────────────┘  └──────────────────┘        │
│         [ativo]                                     │
│                                                     │
│  ┌─ Setor: Cozinha ─────────────────────────────┐  │
│  │  ┌─ Subcategoria: Pista Quente ─────────┐    │  │
│  │  │  □ Limpeza Inicial Forno             │    │  │
│  │  │    (mostra apenas itens de ABERTURA) │    │  │
│  │  └──────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  + Novo Item (já vai criar como tipo selecionado)  │
└─────────────────────────────────────────────────────┘
```

**Benefícios:**
- Lista fica mais limpa e organizada
- Ao criar novo item, o tipo já está pré-selecionado
- Facilita visualizar todas as tarefas de um tipo

### 2. Sistema de Recuperação (Lixeira)

Implementar "soft delete" com coluna `deleted_at` no banco de dados:

```
┌─────────────────────────────────────────────────────┐
│  [Lixeira] 🗑️  (botão no canto superior)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Itens excluídos recentemente (últimos 30 dias):   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ □ Verificar temperatura    [Restaurar] [🗑️] │  │
│  │   Excluído há 2 dias                         │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ □ Limpeza geral            [Restaurar] [🗑️] │  │
│  │   Excluído há 5 dias                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [Esvaziar Lixeira]                                │
└─────────────────────────────────────────────────────┘
```

**Benefícios:**
- Possibilidade de recuperar exclusões acidentais
- Exclusão permanente só após 30 dias ou manual
- Segurança adicional para dados importantes

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| **Banco de Dados** | Adicionar coluna `deleted_at` na tabela `checklist_items` |
| `src/components/checklists/ChecklistSettings.tsx` | Adicionar seletor de tipo (Abertura/Fechamento) e filtrar itens |
| `src/hooks/useChecklists.ts` | Modificar delete para soft delete, adicionar função de restore |
| `src/components/settings/ChecklistSettingsManager.tsx` | Adicionar botão e modal da lixeira |

---

## Seção Tecnica

### Migração do Banco de Dados

```sql
-- Adicionar coluna deleted_at para soft delete
ALTER TABLE checklist_items 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Criar índice para performance
CREATE INDEX idx_checklist_items_deleted_at 
ON checklist_items(deleted_at) WHERE deleted_at IS NULL;

-- Atualizar query padrão para ignorar itens deletados
-- (será feito no código)
```

### Mudanças no ChecklistSettings.tsx

```tsx
// Novo estado para tipo selecionado nas configurações
const [selectedType, setSelectedType] = useState<ChecklistType>('abertura');

// Filtrar itens pelo tipo selecionado
const filteredItems = subcategory.items?.filter(
  item => (item as any).checklist_type === selectedType
);

// Ao criar novo item, já passa o tipo selecionado
const handleOpenItemSheet = (subcategoryId: string, item?: ChecklistItem) => {
  // ... código existente ...
  setItemChecklistType(selectedType); // Usa o tipo selecionado como padrão
};
```

### Seletor de Tipo (Componente)

```tsx
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setSelectedType('abertura')}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
      selectedType === 'abertura' 
        ? "border-amber-500 bg-amber-50 text-amber-700" 
        : "border-border bg-card text-muted-foreground"
    )}
  >
    <Sun className="w-5 h-5" />
    <span className="font-semibold">Abertura</span>
  </button>
  <button
    onClick={() => setSelectedType('fechamento')}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
      selectedType === 'fechamento' 
        ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
        : "border-border bg-card text-muted-foreground"
    )}
  >
    <Moon className="w-5 h-5" />
    <span className="font-semibold">Fechamento</span>
  </button>
</div>
```

### Mudanças no Hook useChecklists.ts

```tsx
// Soft delete - marca como deletado ao invés de remover
const deleteItem = useCallback(async (id: string) => {
  const { error } = await supabase
    .from('checklist_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await fetchSectors();
}, [fetchSectors]);

// Restaurar item
const restoreItem = useCallback(async (id: string) => {
  const { error } = await supabase
    .from('checklist_items')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw error;
}, []);

// Buscar itens na lixeira
const fetchDeletedItems = useCallback(async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .not('deleted_at', 'is', null)
    .gte('deleted_at', thirtyDaysAgo.toISOString())
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return data;
}, []);

// Exclusão permanente
const permanentDeleteItem = useCallback(async (id: string) => {
  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}, []);
```

### Atualizar Query de Fetch (Ignorar Deletados)

```tsx
const fetchSectors = useCallback(async () => {
  const { data, error } = await supabase
    .from('checklist_sectors')
    .select(`
      *,
      subcategories:checklist_subcategories(
        *,
        items:checklist_items(*)
      )
    `)
    .is('checklist_items.deleted_at', null)  // Ignorar deletados
    .order('sort_order')
    // ...
}, []);
```

### Componente da Lixeira (TrashBin)

```tsx
// Novo componente: src/components/checklists/ChecklistTrash.tsx
export function ChecklistTrash({ 
  onRestore, 
  onPermanentDelete 
}: Props) {
  const [deletedItems, setDeletedItems] = useState<ChecklistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Buscar itens deletados ao abrir
  useEffect(() => {
    if (isOpen) {
      fetchDeletedItems().then(setDeletedItems);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* ... UI da lixeira ... */}
    </Sheet>
  );
}
```

---

## Ordem de Execucao

1. **Migração do banco** - Adicionar coluna `deleted_at`
2. **Atualizar hook** - Modificar delete/fetch, adicionar restore
3. **Atualizar ChecklistSettings** - Adicionar seletor de tipo + filtro
4. **Criar componente Lixeira** - Modal para visualizar/restaurar
5. **Integrar no ChecklistSettingsManager** - Botão da lixeira

---

## Resultado Esperado

- Tarefas de Abertura e Fechamento em listas separadas
- Novo item criado automaticamente no tipo selecionado
- Botao de lixeira no canto da tela de configuração
- Itens excluídos podem ser recuperados por até 30 dias
- Exclusão permanente manual disponível na lixeira
