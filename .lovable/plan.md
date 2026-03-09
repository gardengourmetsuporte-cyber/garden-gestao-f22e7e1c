

# Correção: Salto da tela ao editar e scroll de retorno ao item

## Problemas Identificados

1. **Salto da tela ao focar input**: O drawer (Vaul) no mobile reajusta sua altura quando o teclado virtual abre, causando um pulo visual. O `max-h-[96vh]` no `sheet.tsx` conflita com o viewport que encolhe quando o teclado aparece.

2. **Scroll de retorno não funciona consistentemente**: O `scrollToItem` existe mas a categoria pode estar colapsada (o código tenta expandir mas usa `.click` sem `()` — é um bug). Além disso, o delay de 400ms pode não ser suficiente após o drawer fechar e os dados recarregarem.

## Mudanças

### 1. Estabilizar o drawer com teclado virtual (`src/components/ui/sheet.tsx`)
- No `DrawerPrimitive.Content` mobile, trocar de `max-h-[96vh]` para `max-h-[96dvh]` (dynamic viewport height que acompanha o teclado)
- Adicionar `overscroll-behavior-contain` para evitar scroll propagation

### 2. Auto-scroll do input focado (`src/components/inventory/ItemFormSheetNew.tsx`)
- Adicionar um handler `onFocus` nos inputs que faz `scrollIntoView` do campo focado dentro do drawer após um pequeno delay (para aguardar o teclado abrir)
- Usar `useEffect` com `visualViewport.resize` event para reposicionar o conteúdo quando o teclado aparece

### 3. Corrigir scroll de retorno ao item (`src/pages/Inventory.tsx`)
- Corrigir o bug `.click` → `.click()` (faltava os parênteses para chamar a função)
- Aumentar delay para 600ms para garantir que o drawer fechou e os dados atualizaram
- Expandir automaticamente a categoria do item editado usando `setExpandedCategories`

## Detalhes Técnicos

```typescript
// sheet.tsx - usar dvh ao invés de vh
"max-h-[96dvh]"

// ItemFormSheetNew.tsx - auto-scroll input into view
const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
};

// Inventory.tsx - fix category expansion + scroll
const scrollToItem = (itemId: string) => {
  // Find the item's category and expand it first
  const item = items.find(i => i.id === itemId);
  const catName = item?.category?.name || 'Sem Categoria';
  setExpandedCategories(prev => new Set([...prev, catName]));
  
  setTimeout(() => {
    const el = document.querySelector(`[data-item-id="${itemId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary/50', 'rounded-2xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50', 'rounded-2xl'), 2000);
    }
  }, 350);
};
```

## Arquivos Modificados
1. `src/components/ui/sheet.tsx` — dvh + overscroll contain
2. `src/components/inventory/ItemFormSheetNew.tsx` — auto-scroll on focus
3. `src/pages/Inventory.tsx` — fix scroll restoration + category expansion

