

## Problema
Os ícones dos setores (Cozinha, Salão, Caixa, Banheiros) usam um fundo colorido sólido (círculo/quadrado) com ícone branco dentro — visual pesado e "infantil" para a estética premium Atlas.

## Proposta: Ícone monocromático com indicador lateral de cor

Trocar o círculo colorido por um layout mais refinado, inspirado no Linear/Mercury:

```text
┌──────────────────────────────────────────┐
│ ┃  🍳  Cozinha                    ── ▸  │
│ ┃      0/23 concluídos                   │
└──────────────────────────────────────────┘
```

**Abordagem:** Remover o fundo colorido do ícone. Em vez disso:
1. **Ícone monocromático** (`text-muted-foreground`) usando `AppIcon` (Material Symbols) — elegante e leve
2. **Barra lateral fina** (3px, `rounded-full`) com a cor do setor no lado esquerdo do card — indicador sutil de identidade
3. Quando o setor estiver **100% completo**, o ícone vira um check verde e a barra lateral fica verde

## Mudanças técnicas

### `src/components/checklists/ChecklistView.tsx`
- Remover o `iconMap` de Lucide (linhas 61-67) e usar `AppIcon` com mapeamento via `iconMap.ts`
- Remover o `div` com `backgroundColor: sector.color` (linhas 277-289)
- Substituir por:
  - Uma `div` de barra lateral (3px width, height full, `rounded-full`, `backgroundColor: sector.color`)
  - Um `AppIcon` com `fill={0}` (outlined), `text-muted-foreground`, sem fundo
- Quando completo: ícone `check_circle` verde, barra lateral verde

### `src/components/checklists/ChecklistSettings.tsx`
- Atualizar o preview do setor na tela de configurações para refletir o mesmo estilo (barra lateral + ícone outlined)

## Resultado visual
- Visual limpo, minimalista, premium
- A cor do setor aparece como detalhe sutil (barra lateral), não como bloco pesado
- Consistente com a estética Linear/Mercury do Atlas

