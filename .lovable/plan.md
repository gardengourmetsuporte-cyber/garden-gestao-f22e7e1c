

# Plano de UX — Tornar o Dashboard mais amigável e alinhado ao padrão de mercado

Após análise completa do código atual, identifiquei **7 ajustes** que trariam o maior impacto em usabilidade, baseados em padrões de apps de gestão modernos (iFood Business, Toast, Square, Shopify Mobile):

---

## 1. Saudação mais rica com subtítulo contextual
**Problema:** O `DashboardContextBar` mostra apenas "Bom dia, Nome 👋" — genérico e sem valor informacional.  
**Solução:** Adicionar uma linha secundária com a data formatada e nome da unidade ativa (como o EmployeeDashboard já faz). Inspira confiança e orientação temporal.

```
Boa tarde, João 👋
Quarta-feira, 12 de março · Unidade Centro
```

---

## 2. View Selector com ícones maiores e feedback tátil
**Problema:** Os tabs de 11px são pequenos demais para toque confortável em mobile — alvo mínimo recomendado é 44px.  
**Solução:** Aumentar padding do seletor para `py-2.5`, texto para `text-xs`, ícones para 16px. Adicionar micro-animação de escala no ativo.

---

## 3. Empty States amigáveis nos widgets
**Problema:** Quando não há dados (ex: sem metas, sem pedidos, sem fechamentos), os widgets ou somem ou mostram texto cru. Isso confunde o usuário novo.  
**Solução:** Criar um componente `EmptyStateCard` reutilizável com ilustração leve (ícone grande + texto guia + CTA), e aplicar nos principais widgets: QuickStats (quando tudo zerado), SalesGoalWidget, CalendarWidget, AnalyticsWidget.

---

## 4. Ações rápidas contextuais (Quick Actions Row)
**Problema:** O dashboard não oferece atalhos diretos para as ações mais comuns — o usuário precisa navegar para módulos. Apps como Square e Toast colocam ações rápidas logo abaixo do greeting.  
**Solução:** Adicionar uma faixa horizontal de ícones grandes (4 botões) abaixo do greeting na aba Operacional: "Fechar Caixa", "Novo Pedido", "Checklist", "Escanear". Reutiliza rotas existentes.

---

## 5. Espaçamento e hierarquia visual refinados
**Problema:** O `mt-3`, `mt-4`, `mt-6` cria ritmo irregular. Alguns widgets ficam colados, outros distantes demais.  
**Solução:** Padronizar espaçamento vertical para `gap-5` com um wrapper flex-col, removendo os `mt-*` avulsos. Adicionar subtítulos de seção ("Visão geral", "Atividade") para criar hierarquia clara.

---

## 6. Card de boas-vindas para primeira visita
**Problema:** Usuários novos veem um dashboard potencialmente vazio sem orientação.  
**Solução:** Mostrar um card de onboarding compacto (diferente do SetupChecklist que é técnico) com mensagem acolhedora e 2-3 sugestões de primeiro passo. Dismiss permanente via localStorage.

---

## 7. Pull-to-refresh visual (mobile)
**Problema:** Não há indicação de que o usuário pode atualizar dados. Em apps de gestão, PTR é esperado.  
**Solução:** Não implementar PTR real (complexo), mas adicionar um botão "Atualizar" sutil no topo do dashboard que invalida as queries do TanStack, com ícone animado de refresh.

---

## Arquivos que serão modificados

| Arquivo | Mudança |
|---------|---------|
| `DashboardContextBar.tsx` | Saudação enriquecida com data e unidade |
| `AdminDashboard.tsx` | Quick actions row, espaçamento padronizado, botão atualizar, seções com subtítulos |
| `QuickStatsWidget.tsx` | Empty state amigável quando tudo zerado |
| `SalesGoalWidget.tsx` | Empty state visual melhorado |
| Novo: `QuickActionsRow.tsx` | Faixa de ações rápidas contextuais |
| Novo: `DashboardEmptyState.tsx` | Componente reutilizável de empty state |

## Escopo técnico
- Apenas componentes React + Tailwind — sem mudanças no banco de dados
- Sem novas dependências
- Respeita o design system "Premium Dark Glass" existente

