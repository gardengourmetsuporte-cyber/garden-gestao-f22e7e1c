

# Modernizacao Visual Completa do Atlas

## Resumo
Vamos fazer uma reformulacao visual em 4 frentes: trocar a biblioteca de icones para **Material Symbols Rounded** (versao moderna e variavel do Google), refinar cards e componentes, ajustar cores/gradientes e melhorar tipografia. O resultado sera um visual mais limpo, leve e premium em todo o sistema.

## O que muda na pratica

### 1. Icones - Material Symbols Rounded (variavel)
Os icones atuais usam "Material Icons Round" (versao antiga, pesada e sem variacao). Vamos trocar para **Material Symbols Rounded**, que sao a versao moderna com controle de peso (weight), preenchimento (fill) e grade -- icones muito mais finos, elegantes e contemporaneos.

- Trocar o link do Google Fonts no `index.html` para Material Symbols Rounded com eixos variaveis (weight 300-500, optical size 24, fill 0)
- Atualizar o componente `AppIcon` para usar a classe `material-symbols-rounded` com `font-variation-settings` configuravel
- Atualizar o `iconMap.ts` com nomes corretos para Material Symbols (a maioria e compativel, alguns precisam de ajuste)
- Migrar os ~99 arquivos que importam Lucide diretamente para usar `AppIcon` (em lotes progressivos, priorizando dashboard, layout e paginas principais)

### 2. Cards e Componentes
- Aumentar o `border-radius` base de `0.875rem` para `1rem`
- Cards com borda sutil (`border: 1px solid hsl(var(--border) / 0.5)`) em vez de depender so de sombra
- Hover mais suave nos cards interativos (sem translateY, apenas sombra e borda)
- Botoes com border-radius maior e transicao de escala mais sutil
- Inputs com fundo mais neutro e borda mais visivel

### 3. Cores e Gradientes
- Dark mode: fundo ligeiramente mais quente (`226 15% 6%`) para menos "apagado"
- Cards dark: elevar levemente (`226 14% 10%`) para mais contraste com o fundo
- Reduzir intensidade dos glows neon (de 0.25 para 0.15 de opacidade) para visual mais sofisticado
- FAB e gradientes: manter mas com transicoes mais suaves
- Light mode: card com sombra mais presente para dar profundidade

### 4. Tipografia e Espacamento
- Titulos de pagina: de `text-lg` para `text-xl` com `font-extrabold` (mais impacto)
- Subtitulos: letter-spacing levemente negativo para visual mais moderno
- Espacamento entre secoes: padronizar em `space-y-5` (um pouco mais respiro)
- Labels de secao: tracking mais estreito e cor ligeiramente mais forte

---

## Detalhes tecnicos

### Arquivos principais afetados

| Arquivo | Mudanca |
|---|---|
| `index.html` | Trocar link Google Fonts para Material Symbols Rounded |
| `src/components/ui/app-icon.tsx` | Classe CSS e font-variation-settings |
| `src/lib/iconMap.ts` | Revisar ~10 nomes que mudaram entre versoes |
| `src/index.css` | Tokens de cor, radius, sombras, glow, tipografia |
| `tailwind.config.ts` | Atualizar radius base |
| ~99 arquivos com `lucide-react` | Migrar para `AppIcon` (em lotes) |

### Estrategia de migracao dos icones Lucide
Como sao 99 arquivos, a migracao sera feita em 3 lotes:
1. **Lote 1**: Layout, Dashboard, Pages principais (~20 arquivos)
2. **Lote 2**: Components de modulos (finance, inventory, employees) (~40 arquivos)
3. **Lote 3**: Settings, UI components, restante (~39 arquivos)

### Compatibilidade
- Material Symbols Rounded usa os mesmos nomes que Material Icons Round na maioria dos casos
- O `iconMap.ts` ja mapeia Lucide -> Material, entao a migracao de Lucide para AppIcon e direta
- Nenhuma dependencia nova precisa ser instalada (fonte via CDN)

