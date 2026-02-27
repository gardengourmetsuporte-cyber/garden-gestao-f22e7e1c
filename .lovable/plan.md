

## Plan: Modernizar Layout da Loja de Recompensas

A tela atual usa cards verticais grandes com imagem aspect-video + botão "Resgatar" ocupando muito espaço. Vou redesenhar para um layout mais compacto e atraente, estilo app de delivery/loja premium.

### Changes

#### 1. `src/components/rewards/ProductCard.tsx` — Redesign completo
- Layout horizontal compacto: imagem quadrada (80x80 rounded-xl) à esquerda, info à direita
- Remover botão "Resgatar" do card — o clique no card inteiro abre o dialog de confirmação
- Badge de pontos com estilo amber/dourado mais chamativo
- Indicador visual de "pode resgatar" vs "pontos insuficientes" (opacidade + badge)
- Estoque como badge sutil inline
- Card com `card-unified-interactive` para consistência

#### 2. `src/pages/Rewards.tsx` — Atualizar hero e grid
- Hero card de saldo: usar padrão "inversão premium" (bg branco com shimmer no dark mode) conforme memória de design
- Grid: mudar de `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` para `space-y-2` (lista vertical compacta), mais adequado para mobile
- Adicionar progress bar mostrando quanto falta para o próximo prêmio mais barato (motivação)
- Seção de resgates com título mais integrado

#### 3. `src/components/rewards/RedemptionHistory.tsx` — Ajuste menor
- Trocar `card-base` por `card-unified-interactive` para consistência
- Manter layout atual que já está bom

