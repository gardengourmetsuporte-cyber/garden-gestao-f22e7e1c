

## Esconder o header do accordion ao expandir

### O que muda

Quando um card estiver **aberto**, o trigger (barra com ícone + nome + badge) vai colapsar visualmente com uma transição suave -- ficando com height 0 e opacidade 0. Quando **fechado**, volta a aparecer normalmente. Isso é feito 100% via CSS usando o seletor `data-state`.

### Implementação

**1. `src/index.css`** -- Adicionar transição no trigger:

```css
.dash-accordion-trigger {
  /* existente... */
  overflow: hidden;
  max-height: 3.5rem; /* altura normal */
  opacity: 1;
  transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
}

.dash-accordion-trigger[data-state="open"] {
  max-height: 0;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  pointer-events: none; /* evita cliques acidentais enquanto invisível */
}
```

**2. `src/components/dashboard/DashboardAccordion.tsx`** -- Adicionar um botão de "minimizar" dentro do `AccordionContent` para que o usuário consiga fechar o card mesmo sem o header visível. Será um pequeno botão no topo do conteúdo expandido com o ícone do widget + label + chevron para cima, funcionando como trigger de colapso.

```text
┌──────────────────────────────────────┐
│ 💰 Saldo financeiro  R$ 12.450   ▴  │  ← mini-header clicável (fecha)
│ ┌────────────────────────────────┐   │
│ │  [conteúdo completo do widget] │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

Esse mini-header usa `AccordionPrimitive.Trigger` (ou wrapping manual via `onValueChange`) para alternar o estado.

### Sem risco

- O Radix Accordion continua controlando o estado
- Apenas CSS esconde o trigger original quando aberto
- O botão dentro do content garante que o card sempre pode ser fechado

