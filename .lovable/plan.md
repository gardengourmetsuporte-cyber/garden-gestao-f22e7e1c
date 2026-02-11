

# Tema Dinâmico por Unidade com Transicao Visual

## Objetivo
Ao trocar de unidade, o sistema muda a cor de destaque (primary/accent) e exibe uma breve animacao de transicao (flash/fade) para deixar claro visualmente que a unidade mudou.

## Como Funciona

Cada unidade tera uma cor associada. Ao trocar, as CSS custom properties (--primary, --neon-cyan, etc.) sao atualizadas no `:root`, e um overlay de transicao aparece brevemente (~400ms) com a nova cor.

### Paleta por Unidade (Padrao Inicial)

| Unidade               | Cor Primaria | Identidade         |
|------------------------|-------------|---------------------|
| Sao Joao da Boa Vista  | Azul (atual) | `217 91% 60%`      |
| Porto Ferreira          | Esmeralda   | `160 84% 45%`      |
| (Novas unidades)        | Roxa        | `262 80% 65%`      |

A cor sera armazenada no proprio campo `slug` da unidade para mapear automaticamente. No futuro, pode-se adicionar uma coluna `theme_color` na tabela `units`.

## Implementacao

### 1. Criar mapa de cores por unidade
Um arquivo `src/lib/unitThemes.ts` com um mapa de slugs para paletas de cores CSS:

```text
slug -> { primary, neonCyan, ring, ... }
```

Inclui um fallback para unidades desconhecidas (cor roxa).

### 2. Atualizar UnitContext para aplicar o tema
Quando `activeUnitId` mudar, o contexto:
- Busca a paleta correspondente ao slug da unidade
- Aplica as variaveis CSS no `document.documentElement.style`
- Dispara um estado `isTransitioning` por 400ms

### 3. Overlay de transicao no AppLayout
Um `div` com posicao fixa que:
- Aparece com um flash sutil na nova cor (opacity 0 -> 0.15 -> 0)
- Dura ~400ms com ease-out
- Nao bloqueia interacao (pointer-events: none)

### 4. Indicador visual no seletor de unidade
Adicionar um pequeno circulo colorido ao lado de cada unidade no dropdown da sidebar, mostrando a cor associada.

---

## Detalhes Tecnicos

### Arquivo novo: `src/lib/unitThemes.ts`
- Exporta `UNIT_THEMES: Record<string, UnitTheme>` mapeando slugs para objetos com valores HSL
- Exporta `getUnitTheme(slug: string): UnitTheme` com fallback
- Exporta `applyUnitTheme(theme: UnitTheme)` que seta as CSS vars no `:root`

### Alteracao: `src/contexts/UnitContext.tsx`
- Importa e chama `applyUnitTheme` dentro do `setActiveUnitId` e na inicializacao
- Adiciona estado `isTransitioning: boolean` ao contexto
- Seta `isTransitioning = true` por 400ms ao trocar

### Alteracao: `src/components/layout/AppLayout.tsx`
- Le `isTransitioning` do `useUnit()`
- Renderiza overlay de transicao condicional com animacao CSS
- Adiciona bolinha colorida no dropdown de unidades

### Alteracao: `src/index.css`
- Adiciona keyframe `unitFlash` para o overlay de transicao

### Nenhuma alteracao no banco de dados
As cores sao mapeadas pelo slug no frontend. Futuramente, pode-se adicionar uma coluna `theme_color` na tabela `units` para personalizacao via configuracoes.
