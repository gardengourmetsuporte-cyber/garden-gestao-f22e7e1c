

## Lançamento em Lote no Estoque

### Problema
A equipe marca itens em uma lousa durante o dia e precisa lançar tudo de uma vez no final da noite. Hoje, precisa abrir item por item para registrar cada movimentação.

### Solução
Criar um **sheet de "Lançamento em Lote"** acessível por um botão no estoque. O fluxo:

1. Abre sheet com lista de todos os itens do estoque agrupados por categoria
2. Cada item tem um campo de quantidade ao lado (inicialmente vazio/zero)
3. Usuário toca no item ou digita a quantidade — só os que tiver valor serão lançados
4. Toggle no topo para escolher se é Entrada ou Saída (default: Entrada)
5. Botão "Confirmar X lançamentos" no final
6. Registra todas as movimentações de uma vez

### UI
- Botão "Lançar em lote" na barra de busca ou como segundo FAB/botão fixo
- Sheet fullscreen com busca no topo
- Itens em lista compacta: `[nome do item] [estoque atual] [+/-] [input qty]`
- Botões rápidos +1, +5 ao lado de cada item
- Badge mostrando quantos itens foram preenchidos
- Botão fixo no rodapé: "Confirmar 5 lançamentos"

### Mudanças

**Novo arquivo: `src/components/inventory/BatchMovementSheet.tsx`**
- Sheet fullscreen com lista de itens agrupados por categoria
- Campo de quantidade por item com botões +1/+5
- Toggle entrada/saída no topo
- Busca para filtrar itens
- Botão de confirmação que chama `registerMovement` para cada item com qty > 0
- Campo de observação geral (opcional)

**Arquivo: `src/pages/Inventory.tsx`**
- Adicionar botão "Lançar em lote" (ícone `ListChecks`) ao lado da busca ou nas tabs
- State para controlar abertura do BatchMovementSheet
- Passar `items`, `categories` e `registerMovement` para o sheet

### Fluxo técnico
- Mantém um `Map<string, number>` com itemId → quantidade
- No confirmar, itera sobre as entradas com qty > 0 e chama `registerMovement` sequencialmente
- Toast com resumo: "X movimentações registradas"
- Limpa o estado e fecha o sheet

