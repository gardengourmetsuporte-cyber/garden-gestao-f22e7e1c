

# Plano: Melhorar Layout — Tipografia, Espaçamento e Visual

## Problemas identificados

1. **Tipografia e hierarquia**: `font-size: 17px` no `html` é grande demais, textos `11px` ficam desproporcionais. Falta contraste claro entre títulos e corpo.
2. **Espaçamento e densidade**: Cards com `gap-4` (16px) e `px-4` criam telas apertadas no mobile. Padding interno dos cards inconsistente.
3. **Visual pesado/escuro**: Background `225 20% 3%` é quase preto puro. Cards `220 30% 6%` com bordas brilhantes (`hsl(200 60% 50% / 0.12)`) e múltiplos efeitos `::after` com shine/shimmer criam ruído visual.

## Mudanças propostas

### 1. Reduzir font-size base e melhorar hierarquia tipográfica
- `html { font-size: 16px }` (de 17px) — reduz densidade geral
- Greeting no dashboard: subir para `text-lg` com `tracking-tight`
- Labels de seção: subir de `11px` para `12px`
- Data/sublabels: subir de `11px` para `12px` com cor mais visível

### 2. Aumentar respiro e espaçamento
- Dashboard container: `gap-5` (de `gap-4`), `py-5` (de `py-3`)
- View selector: `gap-2.5` e padding interno maior nos botões
- Cards: border-radius consistente `16px`, padding interno `p-4` mínimo

### 3. Suavizar o tema escuro
- Background: `225 15% 6%` (de `3%` — menos profundo)
- Card background: `220 15% 9%` (de `7%` — mais contraste com bg)
- Remover efeitos `::after` de shine/shimmer dos cards base (manter só no gradient-primary)
- Bordas dos cards: `border-border/30` mais sutis (remover brilho cyan `hsl(200 60% 50%)`)
- Reduzir intensidade dos glows em 50%
- Muted-foreground: `220 8% 60%` (de `55%` — mais legível)

### 4. Header mobile mais limpo
- Altura do header: `h-12` (de `h-11`) — mais toque visual
- Logo pill com padding mais generoso

### Arquivos modificados
- `src/index.css` — tokens de cor, remoção de efeitos shine, ajuste de sombras
- `src/components/dashboard/AdminDashboard.tsx` — espaçamento do container e grid
- `src/components/dashboard/DashboardContextBar.tsx` — tipografia do greeting
- `src/components/layout/AppLayout.tsx` — altura do header mobile

