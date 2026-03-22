

# Fix: AlertDialogs travando a tela no Fechamento de Caixa

## Problema
Os `AlertDialog` de exclusão e divergência estão renderizados **dentro** do `ScrollArea` do Sheet. Isso causa conflito de portal/z-index — o dialog abre "preso" dentro do Sheet e trava a interação.

## Correção

### `src/components/cashClosing/CashClosingDetail.tsx`

Mover os dois `AlertDialog` (Delete Dialog linhas 625-644 e Divergent Dialog linhas 590-623) para **fora** do `ScrollArea`, retornando-os como fragmento no nível raiz do componente.

Estrutura atual:
```
<ScrollArea>
  ... conteúdo ...
  <AlertDialog delete />
  <AlertDialog divergent />
</ScrollArea>
```

Estrutura corrigida:
```
<>
  <ScrollArea>
    ... conteúdo ...
  </ScrollArea>
  <AlertDialog delete />
  <AlertDialog divergent />
</>
```

Isso permite que o Radix AlertDialog use seu portal corretamente, sem ficar bloqueado pelo overflow do ScrollArea.

### Arquivo editado
1. **`src/components/cashClosing/CashClosingDetail.tsx`** — envolver retorno em Fragment, mover os 2 AlertDialogs para fora do ScrollArea

