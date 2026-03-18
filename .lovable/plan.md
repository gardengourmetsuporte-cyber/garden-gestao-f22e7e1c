

## Plano: Melhorar Layout do Cardápio (Modo Ficha Técnica)

### Problemas Identificados

1. **Ícone laranja genérico nos produtos**: No modo Ficha Técnica (`FichaTecnicaCard` em `ProductCard.tsx`), produtos sem foto exibem um círculo laranja com ícone `Package` genérico — não é informativo nem bonito
2. **Produtos com foto também não aproveitam bem**: A thumbnail é pequena (w-10 h-10) e o ícone da categoria não aparece
3. **Ícone do grupo também é genérico**: O `MenuGroupContent` no modo ficha usa `ChefHat` fixo em vez do ícone real da categoria

### Mudanças Propostas

**1. `src/components/menu/ProductCard.tsx` — FichaTecnicaCard**
- Quando o produto tem foto: exibir a imagem em tamanho maior (w-12 h-12) com `rounded-xl`
- Quando **não** tem foto: usar a primeira letra do nome do produto como avatar (estilo iniciais), com fundo `bg-secondary/60` e texto `text-foreground` — eliminar completamente o ícone laranja genérico
- Manter o layout compacto mas mais legível

**2. `src/components/menu/ProductCard.tsx` — MenuModeCard**  
- Mesma lógica: sem foto → mostrar iniciais do produto no placeholder em vez do ícone de câmera
- Manter a funcionalidade de click para upload

**3. `src/components/menu/MenuGroupContent.tsx`**
- No header do grupo (modo ficha), usar o ícone da categoria do grupo em vez de `ChefHat` fixo — isso requer passar a info da categoria como prop
- Simplificar o espaçamento para ficar mais clean

**4. `src/components/menu/MenuCategoryTree.tsx`**
- Sem mudanças estruturais — o layout de categorias já está bom com o ícone circular colorido

### Resumo Visual
- Produtos sem foto: avatar com iniciais (letra do nome) em fundo neutro
- Produtos com foto: thumbnail arredondada
- Remover todos os ícones laranjas genéricos de produto
- Padronizar tamanhos de thumbnail entre modo menu e modo ficha

