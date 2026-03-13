

# Padronizacao Global do Design System

## Problema Identificado

O sistema usa **pelo menos 5 padroes visuais diferentes** dependendo da pagina:

1. **Pagina Orders** — grid 3-cols com icones coloridos individuais (emerald, blue, amber, violet, red, cyan)
2. **Pagina Employees** — mesmo grid 3-cols mas com cores diferentes por aba (emerald, blue, amber, violet, red, cyan)
3. **AnimatedTabs** (Inventory, Marketing, Recipes, Ranking) — pills horizontais com slider emerald hardcoded
4. **QuickActionsRow** (Dashboard) — grid 4-cols com icones em `bg-primary/10`
5. **Checklists** — grid 2-cols com cards de progresso proprios
6. **WhatsApp** — grid 2-cols com cores individuais por secao (emerald, blue, purple, orange)

Botoes de acao tambem variam: `bg-primary` cheio, `bg-emerald-500/15`, outline com `border-primary/30`, `variant="outline"`, etc.

## Regra Unica Proposta

### Navegacao interna (abas de pagina)
- **Padrao unico**: Grid fixo (3-cols mobile, 6-cols desktop) com icone + label empilhados
- **Cor unica**: `bg-primary/10` + `border-primary/30` + `text-primary` quando ativo
- **Inativo**: `bg-card` + `border-border` + `text-muted-foreground`
- **Eliminar** cores individuais por aba (emerald, blue, amber, violet, etc.)
- Icone ativo em `text-primary`, inativo em `text-muted-foreground`

### AnimatedTabs (slider horizontal)
- Trocar `bg-emerald-500/10` hardcoded por `bg-primary/10`
- Trocar `text-emerald-400` por `text-primary`
- Badges: `bg-primary/15 text-primary` quando ativo

### Botoes de acao
- **Primario (CTA principal)**: `bg-primary text-primary-foreground` (botao cheio)
- **Secundario**: `variant="outline"` com `border-primary/30 text-primary hover:bg-primary/10`
- **Eliminar** qualquer `bg-emerald-*`, `bg-green-*` hardcoded em botoes de acao

### Status badges (manter semanticos)
- Success/Paid: `bg-success/15 text-success`
- Warning/Pending: `bg-warning/15 text-warning`
- Error/Cancelled: `bg-destructive/15 text-destructive`
- Info: `bg-primary/15 text-primary`
- Estes sao semanticos e devem manter cores distintas

### Icones de destaque em cards
- Padrao unico: `bg-primary/10 text-primary` para icones decorativos
- Nao usar `bg-emerald-500/10 text-emerald-500` — usar tokens do design system

## Arquivos a Modificar

1. **`src/components/ui/animated-tabs.tsx`** — trocar emerald hardcoded por primary
2. **`src/pages/Employees.tsx`** — remover cores individuais, usar primary unico
3. **`src/pages/Orders.tsx`** — ja esta ok (usa primary), limpar restos de emerald nos botoes de cotacao
4. **`src/pages/WhatsApp.tsx`** — padronizar icones para primary
5. **`src/pages/Recipes.tsx`** — trocar `bg-emerald-500/10 text-emerald-500` por primary
6. **`src/pages/Customers.tsx`** — verificar e padronizar
7. **`src/pages/DeliveryHub.tsx`** — padronizar icones (manter cores de status)
8. **`src/pages/KDS.tsx`** — manter cores de status (sao semanticas)
9. **`src/components/dashboard/QuickActionsRow.tsx`** — ja esta ok
10. **`src/pages/SupplierPortal.tsx`** — trocar `bg-green-500/20 text-green-400` por tokens
11. **`src/pages/TabletHome.tsx`** — padronizar
12. **`src/pages/TabletBill.tsx`** — padronizar

A ideia central: **tudo que e decorativo ou de navegacao usa `primary`**. Apenas indicadores de **status semantico** (sucesso, erro, pendente) mantem cores distintas.

