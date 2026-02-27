

## Redesign Completo da Landing Page — Alinhado ao Design Interno

O problema atual: a landing usa estilos genéricos (bordas finas, cores básicas) que não refletem a identidade premium do sistema interno (gradientes navy animados, `card-surface`, `finance-hero-card`, glows, shine sweeps).

### Princípio: usar as MESMAS classes CSS e padrões visuais do sistema interno

---

### Arquivos a reescrever (7 componentes):

**1. `LandingNavbar.tsx`**
- Usar `gradient-primary` no botão CTA (mesma classe do sistema)
- Logo com container estilizado (como no sistema)
- Blur backdrop mais forte no scroll
- Links com hover sutil usando `text-primary`

**2. `HeroSection.tsx`** — Visual premium
- Headline com gradiente de texto animado mantido
- Botão CTA usando classe `gradient-primary` (navy animado com shine sweep)
- Screenshot real (`dashboard-mockup.png`) em container `card-surface` com browser chrome bar
- Ambient glows maiores usando `bg-primary/8 blur-[160px]`
- Adicionar badges animados de social proof com ícones
- Layout mais impactante: tipografia maior, mais espaçamento

**3. `ProblemSection.tsx`** — Cards como `card-interactive`
- Usar classe `card-interactive` nos cards (mesmo hover do sistema)
- Ícones dentro de containers com cores semânticas
- Adicionar uma linha de gradiente sutil separando da seção anterior

**4. `SolutionSection.tsx`** — Showcase do sistema real
- 3 passos com screenshots reais (`screenshot-financeiro.png`, `screenshot-checklist.png`, `screenshot-estoque.png`) em containers `card-surface`
- Screenshots com browser chrome bar (como no hero)
- Grid de **10 módulos** em cards `card-interactive` com cores semânticas (success, warning, primary, accent, destructive)
- Hover com scale e shadow usando as mesmas classes do sistema

**5. `PricingSection.tsx`** — Cards premium
- Card "Pro" (destacado) usando `finance-hero-card` como container (o gradiente navy animado com shine sweep — a MESMA classe do card de saldo do financeiro)
- Card "Business" usando `card-surface` com borda
- Toggle mensal/anual mantido
- Features com checkmarks coloridos
- Botão CTA no card destacado: branco sobre navy. No outro: `gradient-primary`

**6. `CTASection.tsx`** — Hero card final
- Container usando `finance-hero-card` (gradiente navy animado com shine)
- Texto claro sobre fundo escuro
- Botão CTA invertido (branco com texto navy)
- Social proof badges inline

**7. `FAQSection.tsx`** — Ajustar accordion
- Items com `card-surface` (arredondado, sombra do sistema)
- Hover com `border-primary/25`
- Manter accordion funcional

### Classes CSS do sistema a reutilizar na landing

| Classe | Onde usar |
|--------|-----------|
| `gradient-primary` | Botões CTA (navbar, hero) |
| `finance-hero-card` | Card de pricing destacado, CTA final |
| `card-surface` | Cards de problema, módulos, FAQ |
| `card-interactive` | Cards de módulos (hover com scale + shadow) |
| `navyCardFlow` animation | Já inclusa nas classes acima |
| `cardShineSwipe` animation | Já inclusa em `finance-hero-card` |

### Resultado esperado
A landing page terá exatamente a mesma "cara" do sistema interno: gradientes navy animados, cards com sombras profundas, shine sweeps, cores semânticas (success, warning, destructive, primary), e screenshots reais — sem nada genérico.

