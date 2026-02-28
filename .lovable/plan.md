

## Plano: Tabs da barra inferior configuráveis pelo admin

Atualmente os 2 slots da barra (posição 2 e 3, ao lado de "Início") são hardcoded como Checklists e Financeiro, com fallback automático se o usuário não tem acesso. A ideia é permitir que o admin da unidade escolha quais módulos aparecem nesses 2 slots.

### Armazenamento

Salvar a preferência no `localStorage` por usuário (`bottombar-pinned-tabs`), contendo um array de 2 `moduleKey` strings. Sem necessidade de tabela no banco — é preferência de UI local.

### Mudanças

**1. Criar componente de configuração `BottomBarTabPicker`**
- Novo arquivo `src/components/settings/BottomBarTabPicker.tsx`
- Lista todos os módulos disponíveis (filtrados por `hasAccess`) exceto `dashboard` e `settings`
- Permite selecionar exatamente 2 módulos para os slots da barra
- Salva no `localStorage`

**2. Criar hook `useBottomBarTabs`**
- Novo arquivo `src/hooks/useBottomBarTabs.ts`
- Lê do `localStorage` os 2 módulos escolhidos
- Resolve as `TabDef` a partir de `ALL_MODULES` (key, icon, label, path)
- Exporta `pinnedTabs` e `setPinnedTabs`
- Fallback: se nenhuma preferência salva, usa o comportamento atual (checklists + finance)

**3. Alterar `BottomTabBar.tsx`**
- Importar `useBottomBarTabs`
- Substituir a lógica de `DEFAULT_TABS` + `FALLBACK_TABS` pelos tabs retornados pelo hook
- Manter "Início" fixo no slot 1, "Mais" fixo no slot 5
- Manter a lógica especial do `CARDAPIO_TABS` intacta

**4. Adicionar entrada nas Configurações**
- No `Settings.tsx` ou no `MoreDrawer.tsx`, adicionar um botão "Personalizar barra inferior" que abre o `BottomBarTabPicker` em um Sheet

### Módulos disponíveis para seleção

Todos de `ALL_MODULES` exceto `dashboard` e `settings`:
Agenda, Copilot, Financeiro, Estoque, Clientes, Pedidos, Checklists, Fechamento, Fichas Técnicas, Funcionários, Recompensas, Ranking, Marketing, Cardápio Digital, WhatsApp

