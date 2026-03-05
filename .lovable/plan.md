

## Plano: Redesign do cradle/notch da barra inferior

### O que o usuário quer
Na imagem de referência, o FAB flutua **acima** da barra com um **contorno circular visível ao redor do botão** que **não encosta** na superfície da barra — há um gap/espaço entre o anel do FAB e a barra. Atualmente o `fab-cradle-ring` funciona como fundo sólido colado na barra, sem gap visível.

### Mudanças necessárias

**1. CSS (`src/index.css`) — Ajustar cradle e notch**
- Aumentar o raio do recorte (mask) no `.tabbar-notch-shell` para criar um buraco maior na barra (ex: `circle 36px` → `circle 34px` com gap)
- No `.fab-cradle-ring`: adicionar uma borda/contorno visível (ex: `border: 3px solid hsl(var(--background))`) e um `box-shadow` que simule o anel externo
- Adicionar gap entre o anel e a barra elevando o FAB um pouco mais (`-top-[28px]`)

**2. `BottomTabBar.tsx` — Ajustar posição do FAB**
- Subir o FAB levemente (`-top-[28px]` ou `-top-[30px]`) para que o contorno do anel não toque a superfície da barra

**3. `FinanceBottomNav.tsx` — Mesmas alterações de posição**
- Aplicar a mesma elevação do FAB para manter consistência

### Detalhes técnicos
- O gap será criado pela combinação de: mask-image com raio maior na barra + FAB posicionado mais alto + anel com borda visível
- O anel terá `border: 3px solid` com cor do background, criando a separação visual entre botão e barra
- O recorte da máscara será ajustado para `circle 36px` (atualmente 40px) garantindo que a barra tenha o "U" invertido sem tocar o anel

