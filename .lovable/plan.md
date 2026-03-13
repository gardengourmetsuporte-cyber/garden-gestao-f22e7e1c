

# Redesign Completo: Tema e Layout Profissional

## Diagnóstico dos Problemas

1. **Excesso de variantes de card** — 12+ classes diferentes (card-base, card-holographic, card-stat-holo, card-command, dash-kpi-card, etc.) criam visual fragmentado sem padrão
2. **Estética "gamer"** — efeitos neon, aurora, holographic, shimmer sweep são excessivos para um SaaS de gestão. Parece um app de jogos, não um sistema profissional
3. **Bordas cyan inconsistentes** — `dash-kpi-card` e `dash-section-body` usam `hsl(200 60% 50%)` (azul) enquanto a primary é verde, criando conflito visual
4. **Tipografia fragmentada** — tamanhos como `9px`, `10px`, `11px` espalhados sem sistema. Labels truncados no QuickStats
5. **View Selector pesado** — botões quadrados grandes com ícone + texto ocupam muito espaço vertical
6. **Animações demais** — aurora drift, card shine swipe, neon pulse, holographic shimmer sobrecarregam a GPU e distraem

## Direção Visual: "Clean SaaS"

Inspiração: Linear, Vercel Dashboard, Mobills — fundos neutros, hierarquia clara, sem efeitos decorativos desnecessários.

```text
┌─────────────────────────┐
│  Header (compacto)      │
├─────────────────────────┤
│  Greeting + Date        │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐      │  ← Tab pills (inline, compactos)
│  └─┘ └─┘ └─┘ └─┘      │
│                         │
│  ┌─────┐ ┌─────┐ ┌───┐ │  ← Stats grid (padronizado)
│  └─────┘ └─────┘ └───┘ │
│  ┌─────┐ ┌─────┐ ┌───┐ │
│  └─────┘ └─────┘ └───┘ │
│                         │
│  ┌─────────────────────┐│  ← Widgets (cards uniformes)
│  │ Calendário          ││
│  └─────────────────────┘│
└─────────────────────────┘
```

## Mudanças Propostas

### 1. Paleta de Cores — Mais Neutra e Profissional
- Background: `220 14% 8%` (cinza-azulado neutro, não quase-preto)
- Card: `220 13% 12%` (contraste sutil mas visível)
- Muted-foreground: `220 8% 55%` → `220 8% 62%` (mais legível)
- Bordas: cor única `border` em todo lugar, sem cores especiais (remover cyan borders)
- Primary mantém verde `156 72% 40%` mas sem glows exagerados

### 2. Cards Unificados — Uma Regra para Todos
- Consolidar para 2 variantes: `.card-surface` (padrão) e `.card-elevated` (destaque)
- Border-radius: `16px` consistente
- Borda: `1px solid hsl(var(--border) / 0.5)` — sem gradientes, sem neon
- Background sólido (sem backdrop-blur excessivo, sem `::after` shine)
- Remover: `card-holographic`, `card-stat-holo`, `card-glow`, `card-glass`
- `dash-section-body` e `dash-kpi-card`: usar mesma base sem bordas cyan

### 3. View Selector — Tab Pills Compactos
- Trocar botões quadrados por pills horizontais em linha
- Altura reduzida: `h-9` com `px-4`
- Sem ícones grandes em blocos — ícone 14px + texto na mesma linha
- `rounded-full` estilo pill, fundo translúcido quando ativo

### 4. Tipografia Consistente
- Sistema de 4 tamanhos: `12px` (labels), `13px` (body), `14px` (emphasis), `16px+` (títulos)
- Eliminar `9px` e `10px` — mínimo `11px` para acessibilidade
- QuickStats: labels completos sem truncar, subir para `text-[11px]`

### 5. Limpeza de Efeitos
- Remover: aurora mesh no finance-hero, holographic shimmer, card shine sweep, neon border pulse
- Manter apenas: fade-in simples, slide-up sutil, spring-in para entrada
- Glows reduzidos a 0 (sem box-shadow colorido — apenas sombras neutras)
- Finance hero: gradiente estático sutil ao invés de aurora animada

### 6. QuickStats Redesign
- Cards com padding aumentado, texto visível
- Ícone + número lado a lado, label embaixo sem truncar
- Border mais sutil, sem variantes de cor exageradas

### Arquivos Modificados
- `src/index.css` — tokens, remoção de efeitos, unificação de cards
- `src/components/dashboard/AdminDashboard.tsx` — view selector como pills
- `src/components/dashboard/QuickStatsWidget.tsx` — layout mais respirado
- `src/components/dashboard/DashboardHeroFinance.tsx` — simplificar visual
- `src/components/dashboard/DashboardContextBar.tsx` — tipografia
- `src/components/dashboard/SalesGoalWidget.tsx` — usar card unificado
- `src/components/dashboard/SetupChecklistWidget.tsx` — ajustes de espaçamento
- `src/components/dashboard/UnifiedCalendarWidget.tsx` — remover classes inconsistentes

