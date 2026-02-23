

# Modernizacao Visual Completa do Atlas

## Status
- [x] **Fundação**: index.html (Material Symbols Rounded), AppIcon (font-variation-settings), index.css (tokens, cores, tipografia, cards), tailwind.config.ts (radius)
- [x] **Lote 1**: Dashboard widgets (ChecklistDashboardWidget, QuickStats, SectorPointsSummary, UnifiedCalendarWidget), Pages (NotFound, Settings)
- [ ] **Lote 2**: Components de modulos (finance, inventory, employees, chat, agenda, etc.) (~40+ arquivos com lucide-react)
- [ ] **Lote 3**: Settings, UI components, landing, restante (~60+ arquivos com lucide-react)

## O que ja foi feito

### Icones
- Trocado Google Fonts para Material Symbols Rounded (variavel, weight 100-700, fill 0/1)
- AppIcon agora usa `material-symbols-rounded` com `font-variation-settings` configuravel (fill, weight, opsz)
- CSS atualizado para referenciar `.material-symbols-rounded` em vez de `.material-icons-round`

### Cores e Gradientes
- Dark mode: fundo mais quente (226 15% 6%), cards mais elevados (226 14% 10%)
- Glows reduzidos de 0.25 para 0.15 de opacidade
- Light mode: fundo off-white (0 0% 98%), cards com sombra + borda sutil via shadow token

### Cards e Componentes
- Border-radius base aumentado para 1rem
- card-interactive: borda sutil (border 1px solid), hover sem translateY (apenas shadow)
- Adicionado border-radius 3xl ao tailwind config

### Tipografia
- page-title: text-xl font-extrabold com letter-spacing -0.02em
- section-title: font-bold com letter-spacing -0.01em
- section-label: cor mais forte (muted-foreground/80)

## Proximos passos
- Continuar migracao Lucide -> AppIcon nos lotes 2 e 3 (sob demanda do usuario)

