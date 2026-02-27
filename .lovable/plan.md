

## Redesign Completo da Landing Page — Inspirado no Lovable

A landing atual tem muitos gradientes, glows, e phone mockups que destoam do padrão clean/moderno. O redesign segue a estética Lovable: tipografia centralizada grande, backgrounds sutis, cards limpos com bordas finas, e espaçamento generoso.

---

### Arquivos a reescrever (7 componentes):

**1. `LandingNavbar.tsx`** — Simplificar
- Logo + nome à esquerda
- Links centrais (Funcionalidades, Planos, FAQ)
- Apenas 1 botão CTA à direita: "Começar grátis" (fundo escuro, texto branco)
- Link "Entrar" como texto simples, sem borda
- Remover botões duplicados no mobile — menu hamburguer com links + 1 CTA

**2. `HeroSection.tsx`** — Layout centralizado
- Remover phone mockup e gradientes mesh
- Headline centralizada grande (`text-5xl sm:text-6xl font-extrabold`)
- Subtítulo `text-muted-foreground` abaixo
- Badge sutil em cima ("Feito por restaurante, para restaurantes")
- 1 CTA centralizado: "Começar grátis" (botão escuro)
- Link secundário: "Já tenho conta" como texto
- Screenshot real do sistema abaixo (em `rounded-2xl` com sombra sutil, sem moldura de celular)

**3. `ProblemSection.tsx`** — Cards minimalistas
- Manter os 3 cards mas com estilo mais limpo
- `card-surface p-8` sem efeitos extras
- Emoji menor, tipografia mais sóbria
- Grid 3 colunas no desktop

**4. `SolutionSection.tsx`** — Steps 1-2-3 como "Meet Lovable"
- Substituir layout alternado com phone mockups por uma seção de 3 passos numerados
- Cada passo: número grande + título + descrição + screenshot em `rounded-2xl` com `shadow-card`
- Screenshots em container largo (não phone mockup)
- Abaixo dos passos, grid 2x2 com os 4 módulos (Financeiro, Checklist, Estoque, Relatórios) como cards com ícone + título + descrição curta

**5. `PricingSection.tsx`** — Estilo Lovable pricing
- Cards com fundo `bg-card`, borda `border` sutil
- Sem gradientes nos cards
- Preço grande + features com checkmarks
- Botão CTA: card destacado usa fundo escuro, outro usa borda
- Toggle mensal/anual mantido

**6. `CTASection.tsx`** — Simplificar
- Fundo limpo, sem gradientes mesh
- Headline + subtítulo centralizados
- 1 botão CTA escuro
- Texto "14 dias grátis" abaixo

**7. `FooterSection.tsx`** — Manter simples, apenas ajustar espaçamento

---

### Mudanças no CSS (`index.css`)
- Nenhuma mudança necessária; os tokens existentes suportam o novo layout

### Padrões visuais do redesign

```text
┌─────────────────────────────────────────┐
│  Logo    Funcionalidades  Planos  FAQ   │
│                              Entrar  CTA│
├─────────────────────────────────────────┤
│         Badge sutil                     │
│    Headline grande centralizado         │
│      Subtítulo muted                    │
│        [Começar grátis]                 │
│         Já tenho conta                  │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │   Screenshot real do sistema    │   │
│   │   (rounded-2xl + shadow-card)   │   │
│   └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│   Card 1    Card 2    Card 3            │
│  (problema) (problema) (problema)       │
├─────────────────────────────────────────┤
│  1. Passo  2. Passo  3. Passo          │
│  + Grid 2x2 módulos                    │
├─────────────────────────────────────────┤
│  Pricing card   Pricing card            │
├─────────────────────────────────────────┤
│  FAQ accordion                          │
├─────────────────────────────────────────┤
│  CTA final                              │
├─────────────────────────────────────────┤
│  Footer                                 │
└─────────────────────────────────────────┘
```

### Resumo
- 7 arquivos reescritos
- Estética limpa, centralizada, sem glows/mesh gradients
- Screenshots reais do sistema em containers limpos (sem phone mockup)
- Tipografia grande e espaçamento generoso
- Cards com `card-surface` e bordas sutis
- 1 CTA por seção, consistente (fundo escuro navy)

