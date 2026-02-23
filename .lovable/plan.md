
# Modernizacao Visual - Estilo Mobills

## Objetivo
Elevar a interface do Garden Gestao para um nivel visual moderno inspirado no Mobills (app financeiro brasileiro), com micro-animacoes, transicoes fluidas, cards com glassmorphism aprimorado e interacoes mais sofisticadas.

## O que muda

### 1. Dashboard - Cards com Micro-Animacoes
- Cards do dashboard ganham animacao de entrada escalonada mais suave (spring physics)
- Widgets ganham efeito de "press" mais pronunciado no toque (scale 0.96 com bounce)
- Numeros financeiros com animacao de contagem mais fluida
- Icones com subtle bounce ao aparecer

### 2. Transicoes de Pagina
- Substituir o fade simples atual por uma transicao slide + fade combinada (similar ao Mobills)
- Ao navegar entre paginas, conteudo desliza suavemente de baixo para cima com deceleration curve
- Adicionar skeleton shimmer com efeito de onda (wave) em vez de pulse simples

### 3. Cards e Superficies
- Finance hero card com gradiente animado sutil (hue-shift lento)
- Cards interativos com hover/press que eleva a sombra de forma mais dramatica
- Bordas com brilho sutil ao interagir (glow on touch)
- Adicionar efeito de "glass" mais refinado nos cards (backdrop-blur aumentado + transparencia ajustada)

### 4. Bottom Navigation e FAB
- Bottom nav com indicador de aba ativa animado (pill que desliza entre as abas)
- Icone ativo sobe levemente (translateY) com transicao suave
- FAB com efeito de ripple no toque

### 5. Listas e Items
- Items de lista com animacao staggered ao carregar (cada item entra com delay)
- Swipe feedback visual mais suave
- Checkmarks com animacao de "pop" ao completar

### 6. Skeleton Loading Melhorado
- Substituir o pulse simples por shimmer wave (gradiente que percorre o skeleton)
- Formato dos skeletons mais proximo do conteudo real

### 7. Header Mobile
- Efeito de blur mais intenso ao scroll
- Transicao de opacidade do background baseada no scroll position

---

## Detalhes Tecnicos

### Arquivos Modificados

**src/index.css** - Novas keyframes e classes utilitarias:
- `@keyframes shimmerWave` - skeleton com wave gradient
- `@keyframes springIn` - entrada com spring physics
- `@keyframes pressScale` - feedback de toque
- `@keyframes gradientShift` - gradiente animado no hero card
- `@keyframes slideIndicator` - indicador de tab deslizante
- `@keyframes checkPop` - animacao de check
- `.animate-spring-in` com stagger delays
- `.skeleton-shimmer` classe para loading wave
- `.card-press` feedback de toque refinado
- `.nav-indicator` pill animada

**tailwind.config.ts** - Novas animations e keyframes registradas

**src/components/dashboard/AdminDashboard.tsx** - Stagger animations com spring timing nos widgets

**src/components/dashboard/EmployeeDashboard.tsx** - Mesmas melhorias de animacao

**src/components/finance/FinanceBottomNav.tsx** - Indicador animado deslizante, icone ativo com translateY

**src/components/layout/AppLayout.tsx** - Header com backdrop-blur dinamico no scroll

**src/components/ui/skeleton.tsx** - Shimmer wave effect

**src/components/ui/page-skeleton.tsx** - Skeletons com formato mais proximo do conteudo

**src/components/agenda/TaskItem.tsx** - Check animation com pop

### Animacoes Chave (CSS)

```text
+---------------------------+----------------------------+
| Animacao                  | Onde aplica                |
+---------------------------+----------------------------+
| springIn (0.5s spring)    | Cards do dashboard         |
| shimmerWave               | Todos os skeletons         |
| gradientShift (8s loop)   | Finance hero card          |
| pressScale                | Botoes e cards tocaveis    |
| slideIndicator            | Bottom nav pill            |
| checkPop                  | Task completion            |
| headerBlur (scroll-based) | Mobile header              |
+---------------------------+----------------------------+
```

### Abordagem
- Todas as animacoes usam `will-change` e `transform` para GPU compositing
- Preferencia por CSS puro (sem libs de animacao extras)
- Respeita `prefers-reduced-motion` para acessibilidade
- Nenhuma mudanca de funcionalidade - apenas visual/interacao
