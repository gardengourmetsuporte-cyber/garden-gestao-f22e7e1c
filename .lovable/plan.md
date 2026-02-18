

# Medalhas Premium - Visual Unico com Efeitos

## Resumo
Remover o botao de bonus e o BonusGuide da aba de medalhas, deixando somente as medalhas com visual premium. Substituir os emojis por icones SVG customizados com efeitos de brilho, rotacao e pulso - cada medalha tera um visual unico e marcante.

## O que muda

### 1. Remover da aba Medalhas
- Botao "Dar Bonus a Funcionario" (admin) - removido da aba medalhas
- Componente `BonusGuide` - removido da aba medalhas
- Manter apenas o `MedalList` puro

### 2. Visual premium para cada medalha
Em vez de emojis genericos, cada medalha tera um **icone SVG inline** com efeitos CSS unicos:

| Medalha | Visual | Efeito |
|---------|--------|--------|
| Funcionario do Mes | Estrela dourada com raios | Rotacao lenta dos raios + pulso de brilho |
| 6 Meses de Casa | Escudo com "6" | Glow ciano pulsante |
| 1 Ano de Casa | Coroa com diamante | Brilho prismatico animado |
| Inventor | Lampada/frasco com faiscas | Faiscas aparecendo e sumindo |

### 3. Layout das medalhas
- Grid 2 colunas (em vez de 4) para dar mais destaque
- Card maior com mais espaco para o icone e efeito
- Fundo com gradiente sutil do tier
- Borda animada quando desbloqueada (glow-border)
- Pontos de bonus bem visiveis: "+50 pts" com cor do tier

## Detalhes Tecnicos

### `src/pages/Ranking.tsx`
- Remover `BonusGuide` import e uso
- Remover botao admin de bonus da aba medalhas
- Remover imports nao utilizados (`Button`, `BonusPointSheet`, `BonusGuide`, estados `bonusSheetOpen`/`selectedEmployee`)
- Aba medalhas fica somente: `<MedalList medals={userProfile.medals} />`

### `src/components/profile/MedalList.tsx`
- Reescrever completamente com visual premium
- Grid `grid-cols-2` com cards maiores
- Cada medalha renderiza um SVG inline customizado (componente interno `MedalIcon`)
- Icone SVG com ~48x48px, com animacoes CSS (keyframes)
- Card com gradiente de fundo, borda com glow animado quando desbloqueada
- Mostrar: icone SVG animado, titulo, descricao curta, "+X pts" com destaque
- Medalhas bloqueadas: grayscale, sem animacao, opacity reduzida

### `src/lib/medals.ts`
- Remover campo `icon` (emoji) da interface `Medal`
- O icone agora sera determinado pelo `id` da medalha dentro do componente `MedalList`

### CSS (inline nos componentes)
Animacoes via `@keyframes` inline no SVG ou via classes Tailwind existentes:
- `medal-spin`: rotacao lenta (8s) para raios da estrela
- `medal-sparkle`: opacidade piscando para faiscas
- `medal-glow-pulse`: glow expandindo e contraindo
- Usar animacoes ja existentes no tailwind config (`glow`, `pulse-soft`, `glow-border`) quando possivel

