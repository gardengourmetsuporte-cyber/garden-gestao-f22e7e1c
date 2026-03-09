

## Correção: Layout bugado dos botões no PDV (mobile)

### Problema identificado
Na tela do PDV em mobile, os botões de ação ("Cancelar Pedido", "Cobrar", "Enviar Pedido") estão sendo cortados/truncados porque o container `flex gap-2` não tem tratamento para overflow. O texto "Enviar P..." está claramente cortado no screenshot.

### Solução

**Arquivo: `src/pages/PDV.tsx`**

1. **Reorganizar o layout dos botões de ação** — mudar de uma linha horizontal para um layout que se adapte melhor ao mobile:
   - Colocar o total e os botões em linhas separadas no mobile
   - Usar `flex-wrap` nos botões para que eles quebrem linha se necessário
   - Reduzir o texto dos botões ou usar ícones-only em telas menores

2. **Ajuste específico**:
   - Trocar o container dos botões de `flex gap-2` para `flex gap-2 flex-wrap justify-end`
   - Garantir que os botões usem texto mais curto: "Cancelar" ao invés de "Cancelar Pedido", "Enviar" ao invés de "Enviar Pedido"
   - Mover a seção de total+botões para um layout em coluna no mobile (`flex flex-col gap-2`)

3. **Layout proposto**:
   - Linha 1: Total à esquerda
   - Linha 2: Botões alinhados à direita com `flex-wrap`

