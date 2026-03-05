

## Plan: Dashboard Premium com Personalidade e Animações

### Visao Geral

Adicionar personalidade visual ao Dashboard Admin com animações de entrada escalonadas, micro-interações nos cards, efeitos visuais premium e um greeting mais vivo. Tudo com CSS puro + classes existentes para manter performance mobile.

### Mudancas

**1. CSS — Novas animações e efeitos (`src/index.css`)**

Adicionar ao final da seção de animações:

- **`@keyframes cardReveal`** — Cards entram com fade + slide lateral sutil + scale (mais orgânico que só slide-up)
- **`@keyframes countUp`** — Efeito de "blur to sharp" nos números do hero financeiro
- **`@keyframes subtleFloat`** — Micro-flutuação em ícones decorativos
- **`.dash-card-reveal`** — Classe que combina cardReveal com stagger delays
- **`.dash-kpi-card` hover upgrade** — Adicionar sutil glow colorido no hover baseado na cor do KPI (border-glow + translateY(-2px))
- **`.dash-section-body` entrada** — Transição de borda que "acende" ao entrar na viewport
- **`.finance-hero-card` melhoria** — Adicionar partículas/dots decorativos via `::before` com gradiente animado sutil

**2. AdminDashboard (`src/components/dashboard/AdminDashboard.tsx`)**

- Greeting: Adicionar um emoji animado (wave) e uma frase motivacional curta rotativa abaixo da data (ex: "Vamos fazer acontecer!", "Dia de resultados!")
- Envolver os widgets com classes `dash-card-reveal` e stagger delays incrementais em vez de usar `animate-spring-in` repetitivo
- Adicionar um efeito de "counter reveal" ao hero financeiro onde os números aparecem com blur-to-sharp

**3. DashboardHeroFinance (`src/components/dashboard/DashboardHeroFinance.tsx`)**

- Adicionar dots decorativos animados no background (CSS pseudo-elements)
- Número do saldo: classe `animate-number-reveal` para efeito de blur→clear
- Chips de lucro/despesas: entrada com stagger independente

**4. DashboardSection (`src/components/dashboard/DashboardSection.tsx`)**

- Envolver com `dash-card-reveal` com delay baseado na posição
- Header: ícone com micro-animação de scale ao montar

**5. DashboardKPIGrid (`src/components/dashboard/DashboardKPIGrid.tsx`)**

- Cada KPI card recebe stagger delay individual
- Números grandes: efeito `animate-number-reveal`
- Ícones: `subtleFloat` animation no idle

### Detalhes Técnicos

Todas as animações usam `will-change: transform, opacity` e `animation-fill-mode: both` para GPU compositing. Sem JS de animação, tudo CSS puro. Os delays usam o sistema `spring-stagger` existente expandido.

Novas keyframes no CSS:

```css
@keyframes cardReveal {
  0% { opacity: 0; transform: translateY(16px) scale(0.97); }
  100% { opacity: 1; transform: none; }
}

@keyframes numberReveal {
  0% { opacity: 0; filter: blur(8px); transform: translateY(4px); }
  100% { opacity: 1; filter: blur(0); transform: none; }
}

@keyframes subtleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
```

### Resumo

| Arquivo | Mudanca |
|---------|---------|
| `src/index.css` | Novas keyframes e classes de animação para dashboard |
| `src/components/dashboard/AdminDashboard.tsx` | Frases motivacionais, stagger melhorado, classes premium |
| `src/components/dashboard/DashboardHeroFinance.tsx` | Number reveal, dots decorativos, stagger nos chips |
| `src/components/dashboard/DashboardSection.tsx` | Entrada animada com card reveal |
| `src/components/dashboard/DashboardKPIGrid.tsx` | Stagger individual, float nos ícones, number reveal |

