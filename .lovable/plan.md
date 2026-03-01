

## Dashboard com Cards Expansiveis (Accordion)

### Conceito

Transformar o layout atual de widgets empilhados em uma lista de **cards compactos com accordion** -- cada widget mostra apenas um header resumido (icone + titulo + dado-chave inline) e ao tocar expande para revelar o conteudo completo. O usuario controla o que quer ver aberto, mantendo a tela limpa.

### Viabilidade

Totalmente viavel. O projeto ja possui:
- `@radix-ui/react-accordion` instalado e configurado (`src/components/ui/accordion.tsx`)
- Sistema de widgets com metadata (label, icon, key) no `useDashboardWidgets`
- `WIDGET_RENDERERS` map que retorna o conteudo de cada widget

A arquitetura atual se encaixa perfeitamente -- cada widget ja tem label e icone, basta envolver os renderers em items de accordion.

### Mudancas

**1. `src/components/dashboard/AdminDashboard.tsx`**
- Substituir o `div` grid de widgets por um componente `Accordion` (type="multiple") do Radix
- Cada widget visivel vira um `AccordionItem` com:
  - **Trigger (header compacto)**: icone do widget + label + dado resumido inline (ex: saldo, contagem)
  - **Content (expandivel)**: o renderer atual do widget
- Persistir quais cards estao abertos em `localStorage` para manter estado entre sessoes
- Manter lazy-loading existente (LazySection) dentro do AccordionContent

**2. `src/hooks/useDashboardWidgets.ts`**
- Adicionar campo `defaultOpen?: boolean` ao `DashboardWidget` para definir quais widgets iniciam expandidos por padrao (ex: finance = true)

**3. `src/index.css` (estilos)**
- Adicionar estilos para os accordion items do dashboard:
  - Header com fundo `card`, borda sutil, rounded-2xl
  - Icone colorido por tipo (financeiro = esmeralda, alertas = amber)
  - Transicao suave de abertura/fechamento
  - Indicador chevron animado

### Visual do card minimizado

```text
┌──────────────────────────────────────┐
│ 💰  Saldo financeiro    R$ 12.450 ▾  │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 📊  Gráfico financeiro              ▾  │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ ⚠️  Contas a vencer         3       ▸  │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐  ← expandido
│ ✅  Checklists            75%       ▴  │
│ ┌────────────────────────────────┐   │
│ │  [conteudo completo do widget] │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### O que nao muda

- Saudacao e data no topo permanecem fixos (fora do accordion)
- SetupChecklistWidget continua separado
- Botao "Gerenciar tela inicial" e DashboardWidgetManager continuam funcionando
- Sistema de visibilidade e reordenacao dos widgets intacto
- Desktop 2-col grid pode ser mantido com accordion items lado a lado

