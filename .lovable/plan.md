

## Plano de Testes Completos — Auditoria End-to-End

Vou usar o browser automation para navegar por todos os módulos principais, verificar renderização, interações e fluxos críticos. O teste será dividido em batches:

### Batch 1: Dashboard + Finance
1. Navegar ao Dashboard (`/`) — verificar widgets (saldo, gráfico, contas a vencer, sugestão de compras, ranking, checklists)
2. Navegar ao Financeiro (`/finance`) — verificar comparativo mensal (variação vs mês anterior), cards de receita/despesa
3. Testar botão Export CSV na aba de transações
4. Verificar fluxo de caixa projetado (widget `cash-flow` no dashboard, se habilitado)

### Batch 2: CRM + Customers
5. Navegar a `/customers` — verificar BirthdayAlerts no topo
6. Verificar tags nos CustomerCards
7. Abrir CustomerSheet e testar adição de tags
8. Verificar link WhatsApp nos alertas de aniversário

### Batch 3: Estoque + Pedidos
9. Navegar a `/inventory` — verificar cards e categorias
10. Navegar a `/orders` — verificar OrdersTab e sugestões de reposição
11. Testar criação de rascunho de pedido via AutoOrderWidget

### Batch 4: Checklists + Cash Closing
12. Navegar a `/checklists` — verificar abertura/fechamento, pontos
13. Navegar a `/cash-closing` — verificar WeeklySummary com variação semanal
14. Testar formulário de fechamento de caixa

### Batch 5: Outros Módulos
15. Navegar a `/employees`, `/recipes`, `/marketing`, `/whatsapp`, `/ranking`
16. Verificar que cada página carrega sem erros (lazy loading funcionando)
17. Checar console por warnings/errors em cada página

### Batch 6: Settings + Edge Cases
18. Navegar a `/settings` — verificar todas as abas
19. Testar DashboardWidgetManager (reordenar/ocultar widgets)
20. Verificar responsividade mobile (viewport 375px)

### Entregáveis
- Relatório completo de cada módulo: OK ou com bugs
- Lista de bugs encontrados com screenshots
- Correções imediatas para qualquer problema identificado

