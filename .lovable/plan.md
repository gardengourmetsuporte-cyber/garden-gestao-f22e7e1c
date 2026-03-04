

## Atualizar Layout dos Cards para Estilo Premium Dark Glass

A imagem de referência mostra cards com estética **deep navy/dark blue glassmorphic** com bordas sutis em cyan/azul e cantos muito arredondados. Vou adaptar o design system existente para aproximar desse visual.

### Mudanças Planejadas

**1. `src/index.css` — Atualizar tokens e classes de card**

- **Dark theme `--card`**: Shift do verde escuro atual (`160 6% 8%`) para um tom mais navy/azul escuro (`220 25% 8%`), alinhando com a paleta da referência
- **`.card-base` / `.card-surface` (dark)**: Atualizar background para navy translúcido com borda sutil cyan/blue glow:
  - `background: hsl(220 30% 6% / 0.7)`
  - `border: 1px solid hsl(200 60% 50% / 0.12)`
  - `backdrop-filter: blur(24px)`
  - Border-radius mantido em `20px`
- **`.dash-kpi-card`**: Mesmo tratamento navy glass com borda cyan sutil
- **`.dash-section-body`**: Background navy glass consistente
- **Accent color glow**: Adicionar sutil `box-shadow` com cyan (`hsl(200 80% 60% / 0.06)`) nos cards para o efeito de brilho da referência

**2. Tokens de cor dark ajustados**
- `--background`: Mais deep navy (`225 20% 3%`)
- `--card`: Navy escuro (`220 20% 7%`)
- `--border`: Tom azulado sutil (`220 15% 15%`)
- `--muted`: Navy médio (`220 15% 12%`)
- Manter `--primary` emerald como está (funciona bem como accent contra navy)

**3. Componentes afetados (sem mudanças de código, apenas CSS)**
- Dashboard KPI cards
- Dashboard section wrappers
- AI Insights widget
- Agenda widget
- Copilot widget
- Checklist widget
- Todos os `card-surface` / `card-base` globais

### O que NÃO muda
- Light theme permanece igual
- Estrutura dos componentes React inalterada
- Fontes, ícones e animações mantidos
- Finance hero card (já tem estilo próprio)

### Resultado esperado
Cards com fundo deep navy semitransparente, bordas sutis luminosas, e sensação premium glassmorphic igual à referência — mantendo todo o accent emerald do Garden.

