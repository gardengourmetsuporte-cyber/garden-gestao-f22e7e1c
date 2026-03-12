

# Plano de Melhorias e Upgrades — Garden Gestão

Após análise completa do codebase (55+ páginas, 100+ hooks, 30+ componentes de layout), identifiquei melhorias em 3 frentes: UX/Visual, Performance e Funcionalidades Novas.

---

## 1. UX e Visual

### 1.1 Saudação contextual no Dashboard Admin
Adicionar greeting personalizado ("Bom dia, João") com data/hora no topo do dashboard admin, similar ao que já existe no EmployeeDashboard.

### 1.2 Skeleton States aprimorados
Substituir `Skeleton className="h-32"` genéricos nos `LazyWidget` por skeletons que imitam a forma real de cada widget (finance card, checklist ring, leaderboard list).

### 1.3 Haptic Feedback nos botões principais
Usar `@capacitor/haptics` (já instalado) para vibração leve em ações como completar checklist, confirmar pagamento e trocar de aba.

### 1.4 Empty States ilustrados
Adicionar ilustrações/ícones animados para estados vazios em módulos (estoque vazio, sem pedidos, sem transações) ao invés de texto simples.

### 1.5 Pull-to-Refresh no mobile
Implementar gesto de pull-to-refresh no dashboard e listas principais para recarregar dados manualmente.

---

## 2. Performance

### 2.1 Prefetch de rotas frequentes
No `BottomTabBar`, adicionar `onPointerEnter` para pre-carregar a próxima rota antes do clique (já existe `preloadRoute` mas não está sendo chamado no hover).

### 2.2 React Query deduplication
Consolidar queries duplicadas — `QuickStatsWidget` e `AdminDashboard` ambos chamam `useDashboardStats`. Garantir que todas compartilhem a mesma `queryKey` e `staleTime`.

### 2.3 Image optimization
Adicionar `loading="lazy"` e `decoding="async"` em avatares e logos que ainda não possuem, especialmente no Leaderboard e lista de funcionários.

### 2.4 Bundle splitting por rota
Verificar que todas as páginas pesadas (Finance, PDV, Copilot) estão lazy-loaded no router — algumas podem estar importadas diretamente.

---

## 3. Funcionalidades Novas

### 3.1 Relatório PDF do fechamento de caixa
Gerar PDF formatado com logo da loja, resumo de vendas por método de pagamento e gráfico de barras. Compartilhável via WhatsApp.

### 3.2 Dashboard de métricas (Analytics)
Nova aba/widget com gráficos de tendência: faturamento semanal, ticket médio, itens mais vendidos, horários de pico. Usando dados existentes de `cash_closings` e `tablet_orders`.

### 3.3 Notificações inteligentes com IA
Usar o modelo Gemini (já integrado) para gerar alertas proativos: "Seu estoque de carne bovina deve acabar em 2 dias" baseado no histórico de consumo.

### 3.4 Exportação Excel avançada
Adicionar botão de exportação `.xlsx` (já tem a lib `xlsx` instalada) em Financeiro, Estoque e Fechamentos com filtros de período.

### 3.5 Modo Quiosque aprimorado
Melhorar o TabletHome com auto-lock após inatividade (timer de 5 min), tela de screensaver com logo da loja animado.

---

## Implementação sugerida (ordem de prioridade)

1. Saudação + Skeleton States (visual imediato)
2. Haptic Feedback + Pull-to-Refresh (UX mobile)
3. Prefetch de rotas + bundle check (performance)
4. Exportação Excel + Relatório PDF (funcionalidades)
5. Dashboard Analytics + Notificações IA (valor avançado)

Cada item é independente e pode ser implementado em etapas separadas.

