

# Integração IA entre Financeiro e Central Recorrente

## Visão Geral

Criar uma edge function que analisa as transações financeiras da unidade, identifica padrões de gastos recorrentes (contas fixas, assinaturas) e sugere adicioná-los à Central Recorrente. A IA cruza as transações com o catálogo de serviços conhecidos (`knownServices.ts`) e detecta padrões de repetição por descrição/valor.

## Arquitetura

```text
finance_transactions ──► Edge Function (detect-recurring) ──► Sugestões
                              │
                              ├── Cruza com knownServices (nome/categoria/URL)
                              ├── Detecta padrões: mesma descrição + valor em 2+ meses
                              └── Filtra já cadastrados em recurring_subscriptions
                              
Sugestões ──► Banner no Dashboard da Central Recorrente
         ──► Cards de sugestão com 1 clique para adicionar
```

## Implementação

### 1. Edge Function `detect-recurring`
- Recebe `unit_id`
- Busca transações dos últimos 3 meses com `is_fixed = true` ou `is_recurring = true`, ou que aparecem com mesma descrição+valor em 2+ meses distintos
- Usa Lovable AI (Gemini Flash) para classificar as transações e extrair: nome do serviço, categoria, tipo (assinatura/conta_fixa), ciclo
- Cruza com a lista de serviços conhecidos para enriquecer com `management_url`
- Filtra itens já existentes em `recurring_subscriptions`
- Retorna array de sugestões

### 2. Hook `useRecurringSuggestions.ts`
- Invoca a edge function
- Cache de 10 minutos
- Retorna sugestões + função `acceptSuggestion` que cria o item na tabela `recurring_subscriptions`
- Função `dismissSuggestion` para ignorar (salva em localStorage)

### 3. Componente `RecurringSuggestions.tsx`
- Banner/seção no Dashboard da Central Recorrente
- Cards com: nome detectado, valor, categoria, badge "IA detectou"
- Botão "Adicionar" (1 clique → cria na tabela)
- Botão "Ignorar" (esconde a sugestão)

### 4. Modificações
- `SubscriptionDashboard.tsx` → renderiza `RecurringSuggestions` acima dos cards de resumo
- `Subscriptions.tsx` → passa dependências necessárias

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/detect-recurring/index.ts` |
| Criar | `src/hooks/useRecurringSuggestions.ts` |
| Criar | `src/components/subscriptions/RecurringSuggestions.tsx` |
| Editar | `src/components/subscriptions/SubscriptionDashboard.tsx` |

## Detalhes Técnicos

### Edge Function — Lógica de detecção
1. Query: transações `expense`/`credit_card` dos últimos 90 dias, agrupadas por `LOWER(description)` + `amount`, contando meses distintos
2. Filtra grupos com `count_distinct_months >= 2`
3. Envia ao Lovable AI (Gemini Flash) com tool calling para extrair estrutura: `{ name, category, type, billing_cycle, estimated_price }`
4. Cruza `name` com `KNOWN_SERVICES` (duplica a lista na edge function) para preencher `management_url`
5. Filtra itens já em `recurring_subscriptions` (query por `unit_id` + nome similar)

### UX das sugestões
- Aparece como seção "🤖 Sugestões da IA" no topo do Dashboard
- Cada card mostra: nome, valor, categoria, botões Adicionar/Ignorar
- Ao adicionar, abre o Sheet pré-preenchido para o usuário confirmar antes de salvar

