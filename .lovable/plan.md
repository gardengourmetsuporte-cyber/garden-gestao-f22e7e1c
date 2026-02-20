
# 4 Cards Visuais -- Categoria, Conta, Fornecedor e Funcionario

## O que muda

Os campos Categoria, Conta, Fornecedor e Funcionario deixam de ser botoes full-width empilhados e passam a ser **4 cards compactos em grid 2x2**, com icone centralizado, label curto e visual premium.

## Como vai ficar

```text
+-------------------+  +-------------------+
|   [icone wallet]  |  |  [icone category] |
|      Nubank       |  |   Materia-prima   |
+-------------------+  +-------------------+
+-------------------+  +-------------------+
|   [icone truck]   |  |  [icone person]   |
|    Fornecedor     |  |   Funcionario     |
+-------------------+  +-------------------+
```

- **Sem selecao:** Card com icone + label generico (ex: "Conta", "Categoria"), fundo `bg-secondary/50`, texto `text-muted-foreground`
- **Com selecao:** Card com icone colorido + nome selecionado, fundo sutil `bg-primary/5`, borda fina `ring-1 ring-primary/20`
- Ao tocar em qualquer card, abre o picker correspondente (ListPicker ou CategoryPicker) -- mesma logica de hoje

## Detalhes Tecnicos

**Arquivo:** `src/components/finance/TransactionSheet.tsx`

1. **Remover** os blocos individuais de Categoria (linhas 526-544), Conta (linhas 546-557), Fornecedor (linhas 577-587) e Funcionario (linhas 589-599), incluindo seus `<Label>` e `<Button variant="outline">`

2. **Substituir** por um unico bloco `<div className="grid grid-cols-2 gap-3">` contendo 4 cards:

   - **Card Conta** (sempre visivel):
     - Icone: `account_balance_wallet` via AppIcon, tamanho 22
     - Label: nome da conta selecionada ou "Conta"
   
   - **Card Categoria** (visivel quando `type !== 'transfer'`):
     - Icone: icone da categoria selecionada ou `category` (fallback)
     - Cor do icone: cor da categoria quando selecionada
     - Label: nome da categoria ou "Categoria"
   
   - **Card Fornecedor** (visivel quando `type === 'expense' || type === 'credit_card'`):
     - Icone: `local_shipping` via AppIcon, tamanho 22
     - Label: nome do fornecedor ou "Fornecedor"
   
   - **Card Funcionario** (mesma condicao do fornecedor):
     - Icone: `person` via AppIcon, tamanho 22
     - Label: nome do funcionario ou "Funcionario"

3. **Estilo de cada card:**
   ```
   button com classes:
   - flex flex-col items-center justify-center gap-1.5
   - p-4 rounded-2xl min-h-[80px]
   - bg-secondary/50 (sem selecao) ou bg-primary/5 ring-1 ring-primary/20 (com selecao)
   - transition-all duration-200
   - text-sm font-medium truncate max-w-full
   ```

4. **Conta de destino** (transferencias) permanece como campo separado abaixo do grid, pois e contextual

5. Quando o grid tiver menos de 4 cards (ex: receita so tem Conta + Categoria), os 2 cards ocupam as 2 colunas normalmente

6. Nenhuma alteracao nos pickers, estados ou logica de dados
