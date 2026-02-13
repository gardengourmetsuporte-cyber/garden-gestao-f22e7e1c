

# Gesto de Puxar para Fechar (Swipe-to-Dismiss) em Todo o App

## Problema
Atualmente todas as telas de edicao/formularios usam o componente `Sheet` (Radix Dialog) que so fecha pelo botao X. No mobile isso e pouco dinamico.

## Solucao

Modificar o componente `Sheet` (`src/components/ui/sheet.tsx`) para que, **no mobile**, ele use internamente o **Vaul Drawer** (ja instalado no projeto) que tem gesto nativo de puxar para baixo para fechar. No desktop, mantem o comportamento atual.

Isso aplica a mudanca automaticamente nos **31 arquivos** que usam Sheet sem precisar alterar nenhum deles.

## Como funciona

- O componente `Sheet` detecta se e mobile via `useIsMobile()`
- **Mobile**: renderiza um `Drawer` do Vaul com handle visual (barra de arrasto) e gesto de swipe-down
- **Desktop**: renderiza o Sheet original (Radix Dialog) como antes
- A API externa (props `open`, `onOpenChange`, `side`, `children`) permanece identica

## Detalhes Tecnicos

### Arquivo modificado: `src/components/ui/sheet.tsx`

- Importar `useIsMobile` e os componentes do Vaul Drawer
- O componente `Sheet` (root) faz o branching: mobile = Drawer, desktop = Radix Dialog
- O componente `SheetContent` no mobile renderiza `DrawerContent` com a barra de arrasto (handle) no topo e `max-height` respeitando as classes existentes
- `SheetHeader`, `SheetTitle`, `SheetDescription` fazem o mesmo branching para usar os equivalentes do Drawer
- O botao X e removido no mobile (o gesto de puxar substitui), mantido no desktop

### Comportamento no mobile
- Tela sobe de baixo (como ja faz)
- Barra de arrasto cinza no topo (100px x 4px, arredondada)
- Puxar para baixo fecha com animacao fluida
- Tocar no overlay (fundo escuro) tambem fecha
- Scroll interno do conteudo funciona normalmente sem conflito com o gesto

### Sem mudancas em outros arquivos
Como o componente Sheet e o ponto central, todos os 31 arquivos que usam `<Sheet>` e `<SheetContent side="bottom">` herdam o comportamento automaticamente.

