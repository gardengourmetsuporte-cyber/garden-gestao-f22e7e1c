

# Redesign Completo — Estilo Spotify Dark

## Analise da Referencia Spotify

O design system do Spotify se baseia em:

```text
┌─────────────────────────────────────┐
│  Background: #121212 (quase preto)  │
│  Surface:    #1E1E1E / #282828      │
│  Cards:      #181818 sem borda      │
│  Primary:    #1DB954 (verde)        │
│  Text:       #FFFFFF / #B3B3B3      │
│  Border:     nenhuma visivel        │
│  Radius:     8px (cards), pill      │
│  Shadows:    zero                   │
│  Depth:      contraste de bg only   │
└─────────────────────────────────────┘
```

**Principios extraidos:**
- Fundo muito escuro, quase preto puro
- Cards sem borda, sem sombra — apenas bg levemente mais claro
- Verde vibrante `#1DB954` como accent unico
- Pill buttons (rounded-full) para filtros/tabs
- Tipografia bold, branca, grande para titulos
- Texto secundario em cinza medio `#B3B3B3`
- Espacamento generoso
- Bottom nav com icones solidos e dot indicator
- Zero decoracao — sem gradientes, sem glows, sem bordas

## Paleta Final — Spotify Adapted

| Token | Valor HSL | Hex aprox |
|---|---|---|
| `--background` | `0 0% 7%` | #121212 |
| `--card` | `0 0% 11%` | #1C1C1C |
| `--secondary` | `0 0% 16%` | #282828 |
| `--accent` | `0 0% 20%` | #333333 |
| `--primary` | `141 73% 42%` | #1DB954 |
| `--foreground` | `0 0% 100%` | #FFFFFF |
| `--muted-foreground` | `0 0% 70%` | #B3B3B3 |
| `--border` | `0 0% 15%` | #262626 |
| `--success` | `141 73% 42%` | #1DB954 |
| `--warning` | `43 96% 56%` | #F5A623 |
| `--destructive` | `0 72% 51%` | #E23636 |
| `--ring` | `141 73% 42%` | #1DB954 |

## Mudancas Tecnicas

### Fase 1 — Tokens CSS (`src/index.css`)

**Reescrever toda a secao `.dark`** com a nova paleta Spotify:
- Background quase preto `0 0% 7%`
- Cards sem borda visivel, apenas bg `0 0% 11%`
- Primary verde Spotify `141 73% 42%`
- Remover TODAS as sombras (`--shadow-card: none`, `--shadow-elevated: none`)
- Gradientes: `--gradient-brand: linear-gradient(135deg, #1DB954, #1ED760)`
- Sidebar: bg igual ao background principal

**Reescrever `.card-base`, `.card-surface`, `.card-elevated`:**
- Remover `border` e `box-shadow` de todos
- Apenas `bg-card rounded-xl` (8px, nao 16px — Spotify usa menos)
- `.card-elevated` = `bg-secondary` (levemente mais claro)

**Reescrever page headers, tabs, badges** com estilo pill:
- `.tab-command` → `bg-transparent gap-2`, items como pills `rounded-full`
- `.badge-status` → ja e pill, manter
- `.page-title` → `text-xl font-bold text-white` (mais compacto)

**Reescrever FAB e nav bar:**
- Nav bar: bg igual ao background, sem border-top, sem sombra
- FAB: `bg-primary rounded-full` (circular, nao rounded-2xl)

### Fase 2 — Componentes base

**`src/components/ui/card.tsx`:**
- `.card-base` → `bg-card rounded-xl` sem borda, sem sombra

**`src/components/ui/button.tsx`:**
- Primary: `bg-primary text-black font-bold rounded-full` (pill, texto preto como Spotify)
- Secondary: `bg-[#282828] text-white rounded-full`
- Outline: `border border-[#727272] text-white rounded-full`
- Ghost: `text-white hover:bg-white/10 rounded-full`
- Remover shadows, remover `hover:-translate-y`

**`src/lib/unitThemes.ts`:**
- Trocar primary para `141 73% 42%`

**`tailwind.config.ts`:**
- `--radius: 0.5rem` (8px base, nao 16px)
- Remover `glow-*` shadows
- Atualizar `glow-border` keyframe para verde

### Fase 3 — Varredura global (~95 arquivos)

- Trocar `rounded-2xl` → `rounded-xl` em cards
- Trocar `bg-primary/15` (icon bgs) → `bg-[#1DB954]/15`
- Trocar `text-primary` → verde Spotify
- Remover referencias a `box-shadow`, `shadow-card`, `shadow-elevated` inline
- Trocar `border border-border/40` → remover de cards (sem borda)
- Manter cores semanticas: `text-success` (receita), `text-destructive` (despesa)

### Fase 4 — Layout do Dashboard

- Header: "Boa noite, [Nome]" em bold grande, sem icone decorativo
- Tab pills: `rounded-full bg-[#282828]` quando ativo, transparente quando inativo
- Stat cards: bg `#1C1C1C`, sem borda, sem sombra, icone circular verde/semantico
- Secoes: titulo em `text-sm font-bold text-[#B3B3B3] uppercase tracking-wider`
- Bottom nav: icones solidos, dot verde em baixo do ativo, sem labels

### Fase 5 — Light theme

- Adaptar a mesma logica: bg branco `#FAFAFA`, cards brancos puros, sem sombra pesada
- Primary permanece verde `#1DB954`
- Bordas quase invisiveis `#F0F0F0`

## Resultado Esperado

```text
┌────────────────────────────┐
│ #121212 background         │
│                            │
│  Boa noite, João    👁 ⚙   │
│                            │
│ ┌──────┐┌──────┐┌──────┐   │
│ │#1C1C1C││#1C1C1C││#1C1C│   │
│ │ 🟢 3  ││ 🔴 2  ││ 📦 5│   │
│ │critic ││fecham ││pedi │   │
│ └──────┘└──────┘└──────┘   │
│                            │
│ ● Operacional  Financeiro  │
│                            │
│ ┌──────────────────────┐   │
│ │ Saldo      R$ 12.450 │   │
│ │ Receitas    R$ 8.200 │   │
│ │ Despesas    R$ 3.100 │   │
│ └──────────────────────┘   │
│                            │
│ CONTAS A VENCER            │
│ ┌──────────────────────┐   │
│ │ Fornecedor X  R$ 500 │   │
│ │ Aluguel      R$ 3.2k │   │
│ └──────────────────────┘   │
│                            │
│  🏠    🔍    ➕    📊    👤  │
└────────────────────────────┘
```

Zero bordas visiveis. Zero sombras. Profundidade apenas por contraste de superficie. Verde vibrante como unico accent. Botoes pill. Tipografia bold e limpa.

## Ordem de Implementacao

1. `src/index.css` — reescrever tokens + card classes + componentes
2. `src/components/ui/button.tsx` — pill style, sem sombra
3. `src/components/ui/card.tsx` — sem borda, sem sombra
4. `src/lib/unitThemes.ts` + `tailwind.config.ts` — verde Spotify
5. Varredura dos 95 arquivos com cores/bordas hardcoded
6. Dashboard + Finance + pages principais

