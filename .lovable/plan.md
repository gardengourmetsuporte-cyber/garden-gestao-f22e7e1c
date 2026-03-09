

## Plano: Logo personalizada da empresa nas Configurações de Aparência

### O que muda para o usuário
Na tela de **Aparência**, além de escolher o tema, o usuário poderá fazer upload da logo da sua empresa. Essa logo será exibida:
- No **topo da tela** (header mobile e sidebar desktop), substituindo o logo padrão do Garden
- Na **tela de carregamento interna** (PageLoader)

### Implementação técnica

**1. Expandir o contexto de unidade (`UnitContext.tsx`)**
- Adicionar `store_info` à interface `Unit` e ao `select` que busca as unidades, para que `activeUnit.store_info?.logo_url` fique disponível globalmente.

**2. Atualizar `AppearanceSettings.tsx`**
- Adicionar seção "Logo da Empresa" acima do seletor de tema.
- Input de upload de imagem com preview circular.
- Ao selecionar, faz upload para o bucket `brand-assets` (já existe) e salva a URL em `units.store_info.logo_url` (merge com o JSON existente).
- Botão para remover a logo.

**3. Atualizar `AppLayout.tsx` (header mobile)**
- Importar `useUnit` e ler `activeUnit.store_info?.logo_url`.
- Se existir, usar a logo da empresa no lugar de `gardenLogo`.

**4. Atualizar `DesktopHeader.tsx` / `AppSidebar.tsx`**
- Mesma lógica: se a unidade tem logo customizada, exibir no lugar do padrão.

**5. Atualizar `PageLoader.tsx`**
- Receber `logoUrl` como prop opcional (passada pelos componentes pai que usam `<PageLoader />`).
- Fallback para `gardenLogo` quando não houver logo customizada.
- Nos locais que renderizam `<PageLoader />` (AppLayout, páginas), passar a logo da unidade quando disponível.

### Arquivos editados
- `src/contexts/UnitContext.tsx` — interface Unit + select
- `src/components/settings/AppearanceSettings.tsx` — seção de upload de logo
- `src/components/layout/AppLayout.tsx` — logo dinâmica no header mobile + PageLoader
- `src/components/layout/DesktopHeader.tsx` — logo dinâmica
- `src/components/layout/AppSidebar.tsx` — logo dinâmica
- `src/components/PageLoader.tsx` — prop opcional de logo

