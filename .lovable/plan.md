

## Design System Extraction: tuyo.com

### Elementos identificados no tuyo.com

**Bottom Nav (o que o usuário mais gostou):**
- Barra flutuante pill-shaped com `border-radius` total (~999px)
- Fundo `rgba(30,30,30,0.9)` com `backdrop-blur`
- 5 ícones com labels, botão central verde limão (#B4FF39) elevado e circular
- Posicionada com margem inferior (~16px), não colada na borda
- Sem borda visível, apenas sombra sutil

**Paleta geral:**
- Background puro preto (#000000)
- Cards: cinza escuro (#111 a #1a1a1a) com bordas sutis (#222)
- Accent: verde limão (#B4FF39 / hsl(80 100% 61%))
- Texto principal: branco puro
- Texto secundário: branco/50-60%

**Tipografia:**
- Headlines extra-bold, tracking tight
- Subtítulos em cor accent (verde limão) para destaque
- Font sizes grandes (48-64px mobile hero)

### Plano de implementação

O foco principal será na **barra inferior flutuante** no estilo Tuyo, aplicada à `BottomTabBar` e `FinanceBottomNav` do app. Não vamos mudar a landing page inteira (o branding navy do Garden está consolidado), mas vamos incorporar o estilo da bottom nav.

#### 1. Redesenhar BottomTabBar no estilo Tuyo

Arquivo: `src/components/layout/BottomTabBar.tsx`

Mudanças:
- Converter a barra de edge-to-edge para **floating pill** com `rounded-full` e margem horizontal/inferior
- Remover o fundo `hsl(var(--background))` sólido e usar `bg-[#1a1a1a]/90 backdrop-blur-2xl`
- FAB central mantém o gradiente navy mas ganha o estilo circular elevado do Tuyo (levemente maior, com sombra mais pronunciada)
- Remover o separator `h-px` no topo
- Adicionar `mx-4 mb-3` para flutuar acima da borda

#### 2. Aplicar mesmo estilo ao FinanceBottomNav

Arquivo: `src/components/finance/FinanceBottomNav.tsx`

Mesmas mudanças de layout para manter consistência.

#### 3. Aplicar ao MenuBottomNav (cardápio digital)

Arquivo: `src/components/digital-menu/MenuBottomNav.tsx`

Já tem estilo parecido (floating), ajustar para ficar idêntico aos outros.

**Arquivos afetados:** 3 componentes de navegação inferior.

