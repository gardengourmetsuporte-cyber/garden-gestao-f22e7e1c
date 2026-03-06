

## Adaptar Layout Visual dos Cards e Barra Inferior (Estilo Wellness App)

Baseado nas 3 referências enviadas, os elementos que você curtiu e que vou adaptar ao Garden:

### 1. Cards com ícone grande + título + subtítulo (estilo "Tool Packs")
Os cards da referência têm: fundo translúcido com gradiente sutil, ícones grandes centralizados (com fundo colorido arredondado), título e descrição curta, e cantos bem arredondados (~24px). Vou criar uma nova classe `.card-feature` no design system que replica esse padrão, usando as cores do Garden (verde, azul, roxo) ao invés das cores wellness.

### 2. Barra inferior com ícones dentro de "bolhas" e indicador ativo
A barra da referência tem: fundo com blur forte, ícones maiores com label embaixo, e o ícone ativo ganha um fundo colorido circular (tipo bolha). Vou adaptar o `BottomTabBar` existente para que o ícone ativo tenha um "pill background" colorido ao invés de apenas mudar de cor/peso — sem perder nenhuma funcionalidade (FAB, More drawer, pinned tabs, etc).

### 3. Botão "Continue" com destaque (accent glow)
O botão verde-limão/chartreuse da referência. Vou adicionar uma variante `accent` no componente `Button` usando a cor primária do Garden com glow.

### Arquivos a modificar

**`src/index.css`** (~30 linhas adicionadas)
- `.card-feature` — card com espaço para ícone grande, título e descrição, fundo glass com toque de cor
- `.tab-active-pill` — fundo pill para ícone ativo na bottom bar
- Ajuste de variáveis para suportar o pill indicator

**`src/components/layout/BottomTabBar.tsx`** (~10 linhas)
- Adicionar um `div` com classe `.tab-active-pill` atrás do ícone quando `active === true`
- Mantém 100% da lógica existente (FAB, slots, preload, haptic, locked, cardápio tabs)

**`src/components/ui/button.tsx`** (~3 linhas)
- Nova variante `accent` no `buttonVariants` com estilo glow usando a cor primária

### O que NÃO muda
- Nenhuma funcionalidade é removida
- Cores primárias do Garden (verde esmeralda) são mantidas
- FAB central, More drawer, pinned tabs — tudo intacto
- Tema light/dark continua funcionando
- Todos os outros componentes permanecem iguais

### Resultado visual esperado
- Bottom bar: ícone ativo ganha um pill/bolha de fundo com cor primária sutil (como na referência wellness)
- Cards de módulo/feature: disponíveis para uso com ícone grande + texto, estilo premium glass
- Botão accent: disponível como variante para CTAs importantes

