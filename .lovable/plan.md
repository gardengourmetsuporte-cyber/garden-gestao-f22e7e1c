

## Plan: Padronizar botão "Salvar e continuar"

### Problema
O botão "Salvar e continuar" no TransactionSheet usa `variant="ghost"` com apenas `text-primary`, ficando visualmente fraco e fora do padrão dos demais botões do app. Conforme a screenshot, ele aparece como texto solto sem fundo, quebrando a hierarquia visual.

### Alteração

**`src/components/finance/TransactionSheet.tsx`** (linhas 874-881)
- Trocar de `variant="ghost"` para `variant="outline"` para dar corpo ao botão com borda emerald
- Adicionar `h-12` para manter mesma altura do botão "Salvar"
- Resultado: botão com borda emerald sutil + texto emerald, criando hierarquia clara (outline = secundário, default = primário)

