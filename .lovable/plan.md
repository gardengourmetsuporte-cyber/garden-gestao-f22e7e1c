

# Plano: Ajustar barra inferior do módulo Cardápio

## Problema

Na barra inferior do Cardápio existem 5 slots: Início, Cardápio, FAB, Config, Config. O último ícone ("Config") deveria ser "Mais" (MoreDrawer) e o penúltimo "Config" está duplicando a função. Sobra um slot que pode ser usado para algo útil.

## Mudanças

### `src/components/layout/BottomTabBar.tsx`

1. **Último ícone → "Mais"**: Quando `isCardapioRoute`, o último botão deve abrir o `MoreDrawer` (igual ao comportamento fora do Cardápio), não a ConfigButton.

2. **Trocar tab "Config" por "Pedidos"**: Substituir o tab `config` (que aponta para `?tab=pedidos`) por um tab de **Pedidos** com ícone `Receipt` apontando para a página de pedidos/orders do módulo (ou listagem de pedidos recentes do delivery). Isso dá acesso rápido aos pedidos — recurso essencial no dia a dia.

Alteração no array `CARDAPIO_TABS`:
```typescript
const CARDAPIO_TABS: TabDef[] = [
  { key: 'home', icon: 'Home', label: 'Início', path: '/cardapio', moduleKey: 'cardapio' },
  { key: 'cardapio', icon: 'MenuBook', label: 'Cardápio', path: '/cardapio?tab=produtos', moduleKey: 'cardapio' },
  { key: 'config', icon: 'Settings', label: 'Config', path: '/cardapio?tab=pedidos', moduleKey: 'cardapio' },
];
```
Muda para:
```typescript
const CARDAPIO_TABS: TabDef[] = [
  { key: 'home', icon: 'Home', label: 'Início', path: '/cardapio', moduleKey: 'cardapio' },
  { key: 'cardapio', icon: 'MenuBook', label: 'Cardápio', path: '/cardapio?tab=produtos', moduleKey: 'cardapio' },
  { key: 'pedidos', icon: 'Receipt', label: 'Pedidos', path: '/cardapio?tab=pedidos', moduleKey: 'cardapio' },
];
```

3. **Último slot**: Trocar o bloco condicional `isCardapioRoute ? <ConfigButton> : <MoreButton>` para sempre renderizar `<MoreButton>` — removendo o tratamento especial do Cardápio no último slot.

```typescript
// Antes (linha ~271):
{isCardapioRoute ? (
  <ConfigButton ... />
) : (
  <MoreButton ... />
)}

// Depois:
<MoreButton moreOpen={moreOpen} slotWidth={slotWidth} onToggle={() => { ... }} />
```

4. **Remover** o componente `ConfigButton` (linhas 284-322), que não será mais usado.

## Resultado

Barra inferior do Cardápio: **Início** | **Cardápio** | **FAB (+)** | **Pedidos** | **Mais**

- "Pedidos" dá acesso rápido à configuração/gestão de pedidos
- "Mais" abre o drawer padrão com acesso a todos os módulos e configurações

