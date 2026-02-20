
# Fase 2 — Auditoria Completa de UX

## Visao Geral

Auditoria sistematica de todo o app para corrigir bugs, inconsistencias visuais, cores hardcoded e problemas de usabilidade.

---

## 1. Bug Critico: Loop Infinito de Re-renders ✅

**Problema:** `usePoints` com `staleTime: 0` e `gcTime: 0` causa re-fetches agressivos que triggeram loop de medicao no Popover de notificacoes (Maximum update depth exceeded).

**Solucao:** Aumentar `staleTime` para 30s e `gcTime` para 60s.

**Status:** CORRIGIDO

---

## 2. Cores Hardcoded no Design System

**Problema:** 39 arquivos usam classes Tailwind diretas (text-red-300, bg-amber-500, text-emerald-600, etc.) e 11 arquivos usam cores hex inline (#ef4444, #22c55e, etc.) em vez de tokens semanticos do design system.

**Prioridade Alta (componentes visiveis em todas as telas):**
- `src/components/finance/FinanceHome.tsx` — text-emerald-300, text-red-300 → usar tokens success/destructive
- `src/components/layout/AppLayout.tsx` — color: '#fff', hsl hardcoded no launcher
- `src/components/rewards/PointsDisplay.tsx` — bg-amber-500/20 → usar neon-amber token

**Prioridade Media (sheets e modais):**
- `src/components/employees/PayslipSheet.tsx` — text-emerald-500/600, bg-emerald-500/10
- `src/components/employees/EmployeePayments.tsx` — color: '#ef4444'
- `src/components/employees/MyPayslips.tsx` — color: '#ef4444'
- `src/components/cashClosing/CashClosingForm.tsx` — color: '#22c55e', backgroundColor: '#22c55e20'
- `src/components/recipes/RecipeSheet.tsx` — text-blue-500, bg-amber-50, text-amber-700
- `src/components/inventory/OrdersTab.tsx` — bg-green-600 hover:bg-green-700

**Prioridade Baixa (dados de config/seed):**
- `src/components/onboarding/OnboardingWizard.tsx` — hex colors em templates (aceitavel)
- `src/components/dashboard/PersonalFinanceChartWidget.tsx` — cor fallback '#64748b' (aceitavel)

---

## 3. Empty States Faltantes

**Problema:** FinanceHome.tsx (linha 184-188) usa texto inline em vez do componente EmptyState padronizado para "Nenhuma conta cadastrada".

**Arquivos:**
- `src/components/finance/FinanceHome.tsx`

---

## 4. Launcher com Cores Light-Mode Hardcoded

**Problema:** O grid de icones no launcher (AppLayout linhas 488-498) usa `hsl(0 0% 95%)` e `hsl(0 0% 88%)` que sao cores light-mode. Em dark mode, os icones ficam invisíveis.

**Solucao:** Usar tokens semanticos (bg-secondary, bg-muted) ou CSS variables.

---

## 5. Consistencia de Feedback Visual

**Problema:** Alguns botoes de acao usam cores de WhatsApp hardcoded (bg-[hsl(142,70%,35%)]) e cores de status inconsistentes entre modulos.

**Arquivos:**
- `src/pages/Orders.tsx` — WhatsApp button hardcoded green
- `src/components/inventory/OrdersTab.tsx` — bg-green-600
- `src/components/cashClosing/CashClosingList.tsx` — bg-amber-500/10

---

## Prioridade de Implementacao

1. ✅ Fix infinite render loop (item 1)
2. Cores hardcoded nos componentes principais (item 2 - alta prioridade)
3. Launcher dark mode fix (item 4)
4. Empty states faltantes (item 3)
5. Cores hardcoded em sheets (item 2 - media prioridade)
6. Feedback visual consistente (item 5)

---

## Estimativa: ~15-20 arquivos modificados
