

## Plano: Corrigir acesso à configuração Colibri PDV

### Problema
A rota `/menu-admin` foi removida (consolidada em `/cardapio`), mas o link de configuração do Colibri no Copilot Integrações ainda aponta para `/menu-admin?section=colibri`, resultando em 404.

Além disso, a configuração do Colibri (tab 'pdv' dentro de CardapioSettings) não está acessível em lugar nenhum do hub de configurações do cardápio.

### Correções

**1. Adicionar redirect `/menu-admin` -> `/cardapio` no `src/App.tsx`**
- Previne qualquer 404 para links antigos

**2. Atualizar `configPath` do Colibri em `src/components/copilot/AgentIntegrations.tsx`**
- Mudar de `/menu-admin?section=colibri` para `/cardapio?section=config&configTab=pdv`

**3. Adicionar seção "Integração PDV" no hub de configurações (`CardapioConfigHub.tsx`)**
- Adicionar nova seção no array `SECTIONS` com id `'pdv'`, que renderiza `CardapioSettings` com `initialTab='pdv'`
- Isso torna a configuração do Colibri acessível diretamente no hub de configurações do cardápio

**4. Suportar query param `configTab` no `CardapioHub`** (se necessário)
- Para que o link do Copilot abra diretamente na aba PDV

### Arquivos alterados
- `src/App.tsx` — adicionar redirect
- `src/components/copilot/AgentIntegrations.tsx` — corrigir configPath
- `src/components/cardapio/CardapioConfigHub.tsx` — adicionar seção PDV/Colibri

