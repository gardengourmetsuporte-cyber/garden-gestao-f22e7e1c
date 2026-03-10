

# Simplificar Unidades nos Ingredientes

## Problema
O card de ingrediente mostra muita informação técnica que confunde: "Unidade Base (Estoque)", "Preço Global", botões de "Alterar" e "Editar" separados, conversão automática, seletor de unidade na receita independente do estoque. O usuário precisa entender 2 conceitos de unidade (estoque vs receita) ao mesmo tempo.

## Solução: Layout simplificado e direto

Reduzir a complexidade visual e conceitual:

1. **Esconder detalhes técnicos por padrão** — O bloco cinza com "Unidade Base (Estoque)" e "Preço Global" fica colapsado. Mostrar apenas o essencial: quantidade, custo calculado
2. **Unificar a linha principal** — Uma única linha com: `[Quantidade] [Unidade ▼] = R$ X,XX`
3. **Preço inline** — Mostrar o preço por unidade como texto pequeno abaixo do nome, não como seção separada expandida
4. **Botão "Editar preço" discreto** — Mover para um ícone no header do card, em vez de uma seção inteira
5. **Remover "Unidade Base" da visão padrão** — Só mostrar quando a unidade da receita difere do estoque (mostra nota de conversão)
6. **Filtrar unidades compatíveis** — Ao invés de mostrar todas as 5 unidades (un, kg, g, L, ml), mostrar apenas as compatíveis com o item (peso OU volume OU unidade)

### Layout proposto

```text
┌─────────────────────────────────────┐
│ 📦 Água sem Gás            ✏️  ✕  │
│    R$ 1,50/un                       │
│                                     │
│  [  1  ] [ un ▼ ]    = R$ 1,50     │
│                                     │
│  Pista KDS: [Nenhuma pista ▼]       │
└─────────────────────────────────────┘
```

Ao clicar no ✏️ abre um mini-dialog para editar preço e unidade base juntos.

## Mudanças Técnicas

### 1. `IngredientRow.tsx` — Reestruturar layout
- **Header**: Nome + preço/unidade inline + botão editar (ícone) + botão remover
- **Corpo**: Apenas a linha `Quantidade | Unidade | Custo` — sem o bloco cinza de detalhes
- **Edição**: Um único dialog/popover para editar preço E unidade base juntos (ao invés de 2 fluxos separados)
- **Unidades no Select**: Filtrar por compatibilidade — itens em `kg` mostram só `kg/g`, itens em `litro` mostram só `L/ml`, itens em `unidade` mostram só `un`
- **Nota de conversão**: Manter mas só quando necessário, mais discreta

### 2. Manter funcionalidade
- A lógica de cálculo não muda
- O alerta de "preço global" continua funcionando
- O KDS continua aparecendo quando há pistas configuradas

