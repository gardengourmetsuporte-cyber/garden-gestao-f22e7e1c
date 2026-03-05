

## Plano: Refazer visual da barra inferior do zero

O usuário quer um redesign completo do layout e visual da bottom bar (mantendo os ícones). Baseado na imagem de referência (IMG_3469), o design correto é:

- Barra sólida com fundo opaco, sem transparência/blur excessivo
- FAB com **fundo de background** formando um "U" invertido (cradle) que se conecta à barra — não um anel transparente com borda
- O FAB flutua com um contorno circular sólido (mesma cor do fundo da barra) criando a ilusão de que a barra "abraça" o botão com um gap

### Mudanças

**1. CSS (`src/index.css`) — Refazer cradle e notch**
- `.tabbar-notch-shell`: manter mask com `circle 38px at 50% 0` para o recorte
- `.fab-cradle-ring`: voltar para `background: hsl(var(--background))` (fundo sólido, não transparente), remover border, adicionar padding de 5px para criar o gap visual entre o anel e o botão interno
- Remover ambient glow da barra (simplificar)

**2. `BottomTabBar.tsx` — Simplificar layout**
- Remover ambient glow div
- Barra com fundo sólido `bg-background` (sem /90 e backdrop-blur)
- FAB posicionado `-top-[28px]` com cradle sólido
- Manter separador top sutil

**3. `FinanceBottomNav.tsx` — Mesmas mudanças**
- Aplicar mesmo design sólido e posicionamento

### Resultado esperado
Barra limpa e sólida com o FAB flutuando acima, envolvido por um anel sólido da mesma cor do background que cria separação visual natural — visual profissional e padronizado.

