

## Plan: Atualizar Layout da Página de Fichas Técnicas

### Problemas identificados
- Botão "+" duplicado: já existe `useFabAction` (linha 87) E um botão manual (linhas 187-191)
- Stats cards usando classes `stat-command` que podem estar desatualizadas
- RecipeCard usando `card-unified` mas pode alinhar melhor com o padrão horizontal compacto

### Changes

#### 1. `src/pages/Recipes.tsx`
- Remover o botão "+" manual (div linhas 187-191) — o FAB já cuida disso
- Manter stats mas com visual mais limpo usando `card-base` padrão
- Garantir espaçamento `px-4 py-3 lg:px-6 space-y-4` conforme padrão

#### 2. `src/components/recipes/RecipeCard.tsx`
- Trocar para layout horizontal compacto: ícone de categoria (40x40) à esquerda, nome + custo no centro, badge + menu à direita
- Usar `card-base` com hover consistente
- Remover badge "Ativo/Inativo" volumoso — usar apenas opacidade para inativo
- Mostrar custo por porção como destaque e ingredientes count inline

