

## Plano: Fechar sheet após salvar ficha técnica

### Problema
Ao salvar uma ficha técnica, o sheet permanece aberto.

### Solução
Adicionar `setSheetOpen(false)` após o save bem-sucedido em `handleSave` no `src/pages/Recipes.tsx`.

### Alteração

**`src/pages/Recipes.tsx`** — linhas 98-101:
```typescript
const handleSave = async (data: any) => {
  if (data.id) await updateRecipe(data);
  else await addRecipe(data);
  setSheetOpen(false);
  setSelectedRecipe(null);
};
```

