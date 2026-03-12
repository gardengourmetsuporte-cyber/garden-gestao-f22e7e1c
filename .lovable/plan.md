

# Efeito de overscroll elástico (bounce orgânico)

## Problema
O `overscroll-behavior: none` no `html, body` (linha 2672 do `index.css`) bloqueia completamente o efeito de bounce nativo do iOS/Android. Isso foi adicionado para evitar que o body scrolle quando drawers/dialogs estão abertos, mas acaba removendo o efeito elástico das páginas normais também.

## Solução
Mover o `overscroll-behavior: none` para ser aplicado **apenas** quando um drawer ou dialog está aberto, não globalmente. Assim as páginas normais terão o bounce nativo orgânico.

### Arquivo: `src/index.css`

1. **Remover** `overscroll-behavior: none` do seletor global `html, body` (linhas 2670-2673)
2. **Adicionar** `overscroll-behavior: none` apenas nos seletores condicionais que já existem (linhas 2676-2680), garantindo que drawers/dialogs continuem sem scroll do body

Também remover o `overscroll-behavior-y: contain` da linha 267 do body base, que tem o mesmo efeito restritivo.

Resultado: páginas com scroll normal terão o bounce elástico nativo do iOS (e Chrome Android), enquanto sheets/drawers continuam protegidos contra scroll indesejado.

