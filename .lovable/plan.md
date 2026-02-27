

## Plano de Padronização Visual — Landing Page ao Sistema

Após auditoria completa do codebase, identifiquei as inconsistências e organizei as correções em blocos de impacto.

---

### 1. Landing Navbar — Botões Desktop com `rounded-lg` (devem ser `rounded-xl`)

**Arquivo**: `src/components/landing/LandingNavbar.tsx`

Os botões desktop "Entrar" (linha 53) e "Teste grátis" (linha 59) usam `rounded-lg`. Todo o sistema usa `rounded-xl` como padrão para botões. Corrigir ambos para `rounded-xl`.

---

### 2. Landing — Cards da ProblemSection usando `style={}` inline avulso

**Arquivo**: `src/components/landing/ProblemSection.tsx`

Os 3 cards de problema usam estilos inline (`style={{ background: "hsl(var(--card))", border: ... }}`). Devem usar a classe `card-surface` do design system, que já aplica `bg-card`, `rounded-2xl`, `shadow-card` e borda automática no dark mode. Isso garante consistência com o resto do app.

---

### 3. Landing — FAQ items usando estilos inline em vez de classes do sistema

**Arquivo**: `src/components/landing/FAQSection.tsx`

Os `AccordionItem` usam `style={{ background: "hsl(var(--card))", border: ... }}` inline. Devem usar `card-surface` para padronizar com o resto.

---

### 4. Landing — PricingSection cards com estilos inline

**Arquivo**: `src/components/landing/PricingSection.tsx`

Os cards de plano usam estilos inline mistos. O card não-highlighted deve usar `card-surface`. O card highlighted pode manter o estilo especial mas usando a classe base + override.

---

### 5. Landing — Espaçamento vertical inconsistente entre seções

Cada seção da landing usa `py-20 md:py-28`, exceto o Hero que usa `pt-28 pb-16 md:pt-36 md:pb-24`. Padronizar o Hero para `pt-28 pb-20 md:pt-36 md:pb-28` para manter ritmo.

---

### 6. Landing — Section headers sem padrão

As seções Problem, Solution, Pricing e FAQ têm um padrão de `<p>` tag + `<h2>` como header. O espaçamento `mb-14`, `mb-16`, `mb-12`, `mb-4` varia entre eles. Padronizar todos para `mb-14`.

---

### 7. Inventory — Skeleton loading usa `py-4` enquanto a página real usa `py-3`

**Arquivo**: `src/pages/Inventory.tsx`  

O estado de loading (linha 124) usa `px-4 py-4` enquanto o estado carregado (linha 154) usa `px-4 py-3 lg:px-6`. Padronizar para `px-4 py-3 lg:px-6`.

---

### 8. PersonalFinance — Skeleton loading usa `py-4` sem `lg:px-6`

**Arquivo**: `src/pages/PersonalFinance.tsx`

Mesma inconsistência: loading state com `px-4 py-4` em vez de `px-4 py-3 lg:px-6`.

---

### 9. GamificationMetrics — Usa `<Card>` component em vez de `card-surface`

**Arquivo**: `src/components/gamification/GamificationMetrics.tsx`

Os 3 metric cards usam `<Card className="p-3">`. O sistema padronizou cards de stats usando a classe `card-surface`. Converter para `<div className="card-surface p-3">` para consistência visual (sombra, borda, border-radius).

---

### 10. Footer — Logo com `rounded-full` enquanto navbar usa `rounded-full` mas com tamanhos diferentes

**Arquivo**: `src/components/landing/FooterSection.tsx`

O logo do footer usa `h-11 w-11` enquanto a navbar usa `h-12 w-12`. Padronizar para `h-10 w-10` em ambos (footer e navbar) ou manter `h-12 w-12` consistente.

---

### Resumo de arquivos afetados

| Arquivo | Tipo de correção |
|---------|-----------------|
| `LandingNavbar.tsx` | `rounded-lg` → `rounded-xl` nos botões desktop |
| `ProblemSection.tsx` | Inline styles → `card-surface` class |
| `FAQSection.tsx` | Inline styles → `card-surface` class |
| `PricingSection.tsx` | Inline styles → classes do design system |
| `HeroSection.tsx` | Ajuste de padding bottom |
| `FooterSection.tsx` | Tamanho do logo padronizado |
| `Inventory.tsx` | Skeleton padding `py-4` → `py-3 lg:px-6` |
| `PersonalFinance.tsx` | Skeleton padding `py-4` → `py-3 lg:px-6` |
| `GamificationMetrics.tsx` | `<Card>` → `card-surface` div |

