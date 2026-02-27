

## Plano: Modernizar Layout do Cardápio Digital (estilo Checklist)

### Problemas Identificados
- Categorias usam `cat.color` (padrão `#6366f1` = roxo/indigo) nos ícones e fundo
- Cada categoria tem cor diferente, criando visual inconsistente
- Ícones de categoria usam emojis hardcoded (`🍴`, `☕`, etc.) ao invés do `AppIcon`
- Layout dos cards de categoria/grupo não segue o padrão moderno do Checklist (cards com `finance-hero-card`, progress bars, hierarquia visual clara)
- Cor padrão de novas categorias é `#6366f1` (roxo)

### Mudanças

**1. `MenuCategoryTree.tsx` — Redesign completo dos cards de categoria**
- Remover fundo colorido individual por categoria (eliminar `cat.color` nos ícones)
- Usar ícone navy uniforme via `AppIcon` com `icon-glow-primary` (padrão do sistema)
- Substituir emojis hardcoded por ícones Material Symbols mapeados
- Aplicar estilo de card expandido inspirado no Checklist: bordas sutis, separadores limpos
- Mudar cor padrão de nova categoria de `#6366f1` para navy do sistema
- Grupo selecionado usa `finance-hero-card` ao invés de `hsl(var(--primary) / 0.1)`
- Botão "Nova Categoria" com estilo mais discreto e alinhado

**2. `MenuGroupContent.tsx` — Header do grupo modernizado**
- Substituir `icon-glow-primary` por estilo compacto navy consistente
- Badges Mesa/Delivery com estilo unificado usando `--primary` ao invés de `--neon-cyan`/`--neon-green`

**3. `ProductCard.tsx` — Limpeza de cores**
- Badges Mesa/Delivery usando `--primary` ao invés de cores neon individuais
- Preço usando `text-primary` ao invés de `--neon-green`
- Estrela de destaque usando `text-primary` ao invés de `--neon-amber`

**4. `CardapioHub.tsx` — Tabs internas modernizadas**
- Tabs Produtos/Opcionais/Config usando estilo consistente navy (sem contadores com cores diferentes)
- Badges de contagem com estilo uniforme

### Resultado
Visual limpo, monocromático navy, consistente com Checklist e demais módulos do sistema. Zero roxo, zero cores aleatórias por categoria.

