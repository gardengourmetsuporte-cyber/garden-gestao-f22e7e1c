
# Padronizar Selects com Bottom-Sheet (Mesmo Padrao do CategoryPicker)

## Problema

Os selects nativos do HTML (`<select>`) usados no formulario de transacoes (Conta, Fornecedor, Funcionario) aparecem como dropdowns brancos/cinza que quebram completamente a estetica dark do app. A tela de Categorias ja usa o padrao correto (bottom-sheet escuro com lista estilizada).

## Solucao

Criar um componente reutilizavel `ListPicker` que replica o padrao visual do `CategoryPicker` para qualquer lista simples, e substituir todos os selects nativos do `TransactionSheet` por ele. Tambem atualizar o `SelectContent` do Radix para usar bottom-sheet no mobile (mesma logica que o Sheet ja faz com Drawer).

---

## Implementacao

### 1. Novo componente: `src/components/ui/list-picker.tsx`

Componente generico de selecao em bottom-sheet, inspirado no CategoryPicker mas para listas simples (sem subcategorias/icones). Recebe:

- `open` / `onOpenChange` - controle de estado
- `title` - titulo do sheet (ex: "Selecionar conta")
- `items` - array de `{ id, label }` 
- `selectedId` - item selecionado
- `onSelect` - callback de selecao
- `allowNone` - se mostra opcao "Nenhum" (default: false)
- `noneLabel` - label customizado para "nenhum" (default: "Nenhum")

Renderiza como Sheet (que automaticamente vira Drawer no mobile com swipe-to-dismiss), com lista de items estilizados no padrao dark -- fundo escuro, hover com `bg-secondary`, check icon no item selecionado, tipografia consistente.

### 2. Modificar `TransactionSheet.tsx`

Substituir os 4 selects nativos por botoes que abrem o `ListPicker`:

| Select atual | Picker |
|---|---|
| Conta (accountId) | ListPicker com contas disponiveis |
| Conta destino (toAccountId) | ListPicker com contas filtradas |
| Fornecedor (supplierId) | ListPicker com fornecedores |
| Funcionario (employeeId) | ListPicker com funcionarios |

Cada um tera um botao trigger identico ao da Categoria (outline, h-12, com chevron), abrindo o bottom-sheet correspondente.

### 3. Atualizar `SelectContent` no Radix Select (`select.tsx`)

Aplicar a mesma logica mobile/desktop que o Sheet ja usa: no mobile, renderizar o `SelectContent` dentro de um Drawer (bottom-sheet) ao inves do popover flutuante nativo do Radix. Isso padroniza automaticamente todos os ~20 usos de `<Select>` espalhados pelo app (agenda, receitas, configuracoes, etc).

---

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/ui/list-picker.tsx` | **Novo** - Componente generico de selecao em bottom-sheet |
| `src/components/finance/TransactionSheet.tsx` | Substituir 4 selects nativos por ListPicker |
| `src/components/ui/select.tsx` | Adicionar branching mobile (Drawer) no SelectContent |

---

## Secao Tecnica

### ListPicker - Estrutura

```text
ListPicker
  └── Sheet (auto-drawer no mobile)
       ├── SheetHeader com titulo
       └── Lista scrollavel
            ├── Item "Nenhum" (opcional)
            └── Items mapeados com:
                 ├── Check icon (se selecionado)
                 ├── Label
                 └── hover: bg-secondary
```

### Select Radix - Branching Mobile

O `SelectContent` detecta `useIsMobile()`:
- **Mobile**: renderiza como Sheet/Drawer com lista de items em vez de popover flutuante
- **Desktop**: mantem popover Radix atual

Isso usa o `SheetMobileContext` ja existente e garante que qualquer `<Select>` do app (Agenda, Receitas, Configuracoes, WhatsApp, etc.) automaticamente use bottom-sheet no mobile.
