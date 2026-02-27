

## Redesign da Landing Page — Layout Inspirado na Referencia (Dark Navy Hero)

A referencia mostra um padrao claro: **hero com fundo navy gradiente full-width**, texto a esquerda + screenshot flutuante a direita, e feature badges abaixo. O layout atual e centralizado generico. Vou reformular para seguir esse padrao.

### Mudancas por componente:

**1. `HeroSection.tsx` — Rewrite completo**
- Fundo `finance-hero-card` cobrindo toda a secao hero (navy gradiente animado com shine sweep)
- Layout split: texto alinhado a esquerda + screenshot real (`dashboard-mockup.png`) flutuando a direita com perspectiva/rotacao 3D sutil
- Navbar sobre fundo escuro (texto branco)
- 3 feature badges abaixo do hero (icone + titulo + desc) em cards com fundo `bg-white/10` translucido
- Botao CTA branco sobre fundo escuro (como na referencia)
- Remover screenshot generico separado, integrar no hero

**2. `LandingNavbar.tsx` — Ajustar para hero escuro**
- Quando nao scrollado: texto branco (`text-white/80`) sobre hero navy
- Quando scrollado: manter blur backdrop atual
- Botao CTA no navbar: `bg-white text-navy` (invertido sobre fundo escuro)

**3. `ProblemSection.tsx` — Cards modernos**
- Manter `card-interactive` mas com layout horizontal (icone a esquerda, texto a direita)
- Fundo com gradiente sutil

**4. `SolutionSection.tsx` — Passos numerados modernos**
- Manter os 3 passos com screenshots reais mas usar cards mais modernos com cantos maiores e sombras mais profundas
- Grid de modulos com `card-surface` e hover elevado

**5. `PricingSection.tsx` — Ja esta ok, manter**

**6. `CTASection.tsx` — Ja usa `finance-hero-card`, manter**

**7. `FAQSection.tsx` — Ja esta ok, manter**

### Arquivos a modificar:
| Arquivo | Mudanca |
|---------|---------|
| `src/components/landing/HeroSection.tsx` | Rewrite: fundo navy full-width, split layout texto+screenshot, feature badges |
| `src/components/landing/LandingNavbar.tsx` | Texto branco no hero, invertido no scroll |
| `src/components/landing/ProblemSection.tsx` | Cards horizontais modernos |
| `src/components/landing/SolutionSection.tsx` | Screenshots com frame moderno, modulos grid atualizado |

### Detalhes do Hero (mudanca principal):
- Container: `finance-hero-card` como classe no section inteiro (navy animado + shine)
- Grid: `md:grid-cols-2` com texto left + imagem right
- Screenshot: `dashboard-mockup.png` com `transform: perspective(1000px) rotateY(-5deg)` e sombra profunda
- Feature badges: 3 cards inline com icone, titulo e descricao curta (`bg-white/10 border-white/15`)
- Botao: `bg-white text-[hsl(220,30%,15%)]` com hover scale

