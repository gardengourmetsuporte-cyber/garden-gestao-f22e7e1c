

# Plano: Limpeza de Dívida Técnica e Qualidade do Código

Baseado nos 10 pontos levantados, organizei as ações em 3 blocos priorizados por impacto vs. esforço.

---

## Bloco 1 — Limpeza Imediata (baixo risco)

### 1.1 Remover componentes duplicados não-utilizados
Os seguintes arquivos em `src/components/inventory/` são versões antigas que **nenhum import referencia**:
- `ItemCard.tsx` (substituído por `ItemCardNew.tsx`)
- `QuickMovementSheet.tsx` (substituído por `QuickMovementSheetNew.tsx`)
- `ItemFormSheet.tsx` (substituído por `ItemFormSheetNew.tsx`)
- `MovementHistory.tsx` (substituído por `MovementHistoryNew.tsx`)

**Ação**: Deletar os 4 arquivos antigos. Renomear os "New" para os nomes originais e atualizar os imports em `Inventory.tsx`.

### 1.2 Renomear exports para consistência
Após remoção dos duplicados, os nomes ficam limpos (`ItemCard`, `QuickMovementSheet`, etc.) sem o sufixo "New".

---

## Bloco 2 — Refatoração de Hooks Grandes

### 2.1 Quebrar `usePOS.ts` (574 linhas)
Separar em:
- `usePOSProducts.ts` — fetch/cache de produtos
- `usePOSCart.ts` — lógica de carrinho (add, remove, discount, notes)
- `usePOSOrders.ts` — pedidos pendentes, realtime, status updates
- `usePOSCheckout.ts` — finalização, impressão, offline queue
- `usePOS.ts` — re-exporta composição dos 4 hooks

### 2.2 Quebrar `useWhatsApp.ts` (344 linhas)
Separar em:
- `useWhatsAppChannels.ts`
- `useWhatsAppConversations.ts`
- `useWhatsAppMessages.ts`
- `useWhatsAppOrders.ts`
- `useWhatsAppKnowledge.ts`

Cada um já é uma função exportada independente — basta mover para arquivo próprio e re-exportar do barrel `useWhatsApp.ts`.

### 2.3 Simplificar `AuthContext.tsx` (~300 linhas)
Extrair:
- `useAuthSubscription.ts` — lógica de polling de subscription + inherited unit plan
- `useAuthSession.ts` — onAuthStateChange, getSession, cache
- `AuthContext.tsx` — fica como provider fino que compõe os hooks

---

## Bloco 3 — Testes e Documentação

### 3.1 Testes unitários para lógica crítica
Adicionar testes para:
- `src/lib/plans.ts` — `planSatisfies`, `MODULE_REQUIRED_PLAN`
- `src/lib/exportExcel.ts` — geração de dados formatados
- `src/lib/exportPdf.ts` — estrutura do PDF
- `src/hooks/usePOSCart.ts` (após refatoração) — add/remove/discount

### 3.2 Documentação de schema (ERD)
Gerar um diagrama Mermaid com as tabelas principais e suas relações, salvo como artifact para referência da equipe.

---

## O que NÃO será feito agora (e por quê)

| Ponto | Razão para adiar |
|-------|-----------------|
| i18n | Requer decisão de produto sobre expansão internacional |
| CI/CD | Depende de setup no GitHub, fora do escopo de código |
| Tipagem compartilhada Edge Functions | Melhor abordar caso a caso conforme surgem bugs |
| Vendor lock-in | Decisão arquitetural de longo prazo, sem ação imediata |

---

## Ordem de execução

1. Deletar duplicados + renomear (5 min)
2. Refatorar `useWhatsApp.ts` em 5 arquivos (já são funções isoladas)
3. Refatorar `usePOS.ts` em 4 sub-hooks
4. Simplificar `AuthContext.tsx`
5. Adicionar testes unitários
6. Gerar ERD diagram

