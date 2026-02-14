
# FAB Expansivel - Botao Unico com Sub-Acoes

## Conceito
Substituir os dois botoes flutuantes (Home + Menu) por um unico FAB que, ao ser clicado, expande um mini-menu radial/vertical com opcoes de acao rapida: **Home**, **Menu Lateral** e potencialmente outros atalhos.

## Como vai funcionar
1. **Estado fechado**: Um unico botao flutuante com icone de "grid" ou "apps" (estilo launcher)
2. **Ao clicar**: O botao rotaciona para "X" e aparecem 2-3 botoes menores acima dele com animacao escalonada (fan-out vertical)
3. **Opcoes exibidas**:
   - **Home** (icone casa) - navega para o dashboard
   - **Menu** (icone menu) - abre o sidebar lateral
4. **Ao clicar em qualquer opcao ou no "X"**: os botoes recolhem com animacao reversa

## Visual
- FAB principal mantem o gradiente neon atual (primary -> cyan)
- Sub-botoes menores (w-11 h-11) com fundo semi-transparente e backdrop-blur
- Animacao de entrada: cada botao sobe com delay escalonado (0ms, 80ms, 160ms) + fade-in + scale
- Quando expandido, um overlay sutil escurece o fundo

## Detalhes Tecnicos

### Alteracoes em `src/components/layout/AppLayout.tsx`:
1. **Remover** o bloco "Floating Home FAB" (linhas 230-246)
2. **Substituir** o bloco "Floating Menu FAB" (linhas 248-279) por um componente FAB expansivel:
   - Novo estado `fabOpen` (boolean) para controlar expansao
   - Ao clicar no FAB principal: alterna `fabOpen`
   - Renderizar sub-botoes condicionalmente com classes de animacao CSS
   - Sub-botao "Home": chama `navigate('/')` e fecha o FAB
   - Sub-botao "Menu": chama `setSidebarOpen(true)` e fecha o FAB
   - O botao Home so aparece quando `location.pathname !== '/'`
3. **Overlay**: quando `fabOpen === true`, renderizar div com `bg-black/40` e `backdrop-blur-sm` que fecha o FAB ao clicar

### Animacoes CSS em `src/index.css`:
- Classe `.fab-action-enter` com keyframe de translate-y + opacity + scale para a entrada dos sub-botoes
- Delays escalonados via `animation-delay` inline

### Posicionamento dos sub-botoes (de baixo para cima):
- FAB principal: posicao atual (bottom dinâmico conforme hasBottomNav)
- Botao 1 (Menu): 64px acima do FAB
- Botao 2 (Home): 120px acima do FAB (so aparece fora da home)
