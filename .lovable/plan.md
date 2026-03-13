

# Implementar Design System Mobills no Garden Gestao

## Analise do Design System Mobills (extraido do dashboard + site)

### Paleta de Cores
- **Primary**: Roxo/Violeta `hsl(270 70% 55%)` — botoes, links, sidebar ativa, CTAs
- **Background**: Cinza escuro profundo `hsl(240 15% 10%)` 
- **Card**: Cinza elevado `hsl(240 12% 16%)` com bordas sutis `hsl(240 10% 22%)`
- **Muted text**: Cinza medio `hsl(240 8% 55%)`
- **Icones semanticos** (mantidos distintos): Azul (banco), Verde (receitas), Vermelho (despesas), Ciano (cartao credito)

### Modelo de Cards
- Border-radius: 16px (rounded-2xl)
- Bordas: 1px solid cinza sutil (quase imperceptivel)
- Sem sombras pesadas — profundidade por contraste de superficie
- Padding interno: 16-20px
- Cards de stat com icone circular colorido a esquerda + label + valor

### Espacamento
- Gap entre cards: 16px (gap-4)
- Padding de pagina: 16px mobile, 24-32px desktop
- Secoes separadas por 20-24px

### Comunicacao Visual
- Tipografia clean, Inter/system-ui
- Labels em cinza medio, valores em branco bold
- Setas de navegacao discretas (chevron right)
- Progress bars com cantos arredondados

## Mudancas no Codigo

### 1. `src/index.css` — Trocar paleta dark theme
- `--primary`: de `156 72% 40%` (verde) para `270 70% 55%` (roxo Mobills)
- `--ring`: acompanha primary
- `--success` permanece verde (semantico)
- `--gradient-brand`: gradiente roxo
- Sidebar tokens acompanham novo primary

### 2. `src/index.css` — Light theme
- `--primary` light: `270 70% 48%`
- Manter estrutura existente, apenas trocar hue

### 3. `src/lib/unitThemes.ts` — Atualizar tema padrao
- Trocar `156 72% 40%` por `270 70% 55%` em todas as referencias

### 4. `tailwind.config.ts` — Atualizar keyframes
- `glow-border` usa hsl do primary (atualizar para novo hue)

### 5. Limpeza global de cores hardcoded (121 arquivos com matches)
- Substituir `emerald-500` / `emerald-400` por tokens `primary` ou `success` conforme contexto
- Substituir `green-*` hardcoded por tokens do design system
- Manter cores semanticas: `bg-blue-500/15` (banco), `bg-red-500/15` (despesa) — estes sao semanticos no modelo Mobills tambem

### 6. Componentes que referenciam cores diretas
- `src/components/finance/FinanceHome.tsx` — `bg-emerald-500/15` → `bg-success/15`
- `src/components/whatsapp/WhatsAppOrders.tsx` — `emerald-500` → `primary`
- `src/pages/WhatsApp.tsx` — conexao status `emerald` → `success` (semantico)
- `src/components/marketing/PostSheet.tsx` — `emerald-400` → `primary`
- Demais 117 arquivos com hardcoded colors serao varridos e padronizados

### Impacto
- A identidade do app muda de **verde** para **roxo** (como Mobills)
- Cards e espacamentos ja estao proximos do padrao Mobills
- Cores semanticas de financas (verde=receita, vermelho=despesa) permanecem
- O primary roxo unifica botoes, navegacao, links, sidebar, badges ativos

