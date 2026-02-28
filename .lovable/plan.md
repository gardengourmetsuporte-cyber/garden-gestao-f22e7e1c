
## Plano: Widget de Insights com IA no Dashboard

### Visão geral
Criar um widget compacto no dashboard que exibe 2-4 cards de insights gerados pela IA, baseados nos dados reais da operação (financeiro, estoque, checklists, equipe). Os insights são carregados em background e atualizados a cada 10 minutos.

### 1. Nova Edge Function: `ai-insights`
- Reutiliza o mesmo padrão de autenticação JWT da `management-ai`
- Consulta dados operacionais (saldo, estoque crítico, despesas pendentes, checklists, boletos vencendo, comparativo mensal)
- Envia snapshot compacto para a IA (gemini-2.5-flash-lite - mais rápido/barato)
- Pede exatamente 3-4 insights curtos em formato JSON via tool calling
- Cada insight: `{ emoji, title, description, action_route? }`
- Cache de 10min via `staleTime` no React Query

### 2. Novo hook: `useAIInsights`
- Chama a edge function `ai-insights` via `supabase.functions.invoke`
- React Query com `staleTime: 10 * 60 * 1000`
- Retorna array de insights tipados

### 3. Novo componente: `AIInsightsWidget`
- Cards minimalistas com emoji, título curto (1 linha) e descrição (1-2 linhas)
- Tap no card navega para a rota relevante (finance, inventory, etc.)
- Skeleton shimmer enquanto carrega
- Sem estado expandido/colapsado - sempre visível e compacto

### 4. Integrar no Dashboard
- Adicionar `'ai-insights'` ao `DEFAULT_WIDGETS` em `useDashboardWidgets`
- Adicionar renderer no `WIDGET_RENDERERS` do `AdminDashboard`
- Posicionar logo após o SetupChecklistWidget (antes dos outros widgets)

### Estrutura dos insights esperados
```text
┌─────────────────────────────────┐
│ 💡 Insights da IA               │
├─────────────────────────────────┤
│ 📉 Margem caiu 12%             │
│ Despesas subiram vs mês passado │
│                                 │
│ ⚠️ 5 itens em estoque crítico  │
│ Picanha e Alcatra quase zerando │
│                                 │
│ 💰 R$2.400 em contas vencendo  │
│ 3 boletos nos próximos 5 dias  │
└─────────────────────────────────┘
```
