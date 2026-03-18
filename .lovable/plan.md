

# Ajustar Enquadramento da Central Recorrente

## Problema
O conteúdo da página não tem padding horizontal, fazendo os cards encostarem/saírem das bordas da tela.

## Solução
Adicionar container com padding na página `Subscriptions.tsx`, seguindo o mesmo padrão usado em outras páginas (como `DashboardPage` que usa `px-4 py-4`).

## Alteração

**`src/pages/Subscriptions.tsx`** — envolver o conteúdo em um container com padding e bottom spacing para o tab bar mobile:

```tsx
// Linha 66: trocar
<div className="space-y-4">
// por
<div className="px-4 py-4 pb-36 lg:pb-12 space-y-4 overflow-hidden">
```

Adicionar `overflow-hidden` para garantir que nenhum elemento filho vaze horizontalmente, e `px-4 py-4 pb-36` para dar respiro visual e espaço para o bottom tab bar.

