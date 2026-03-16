

# Plano: Unificar toda IA em um único Copiloto

## Situação Atual

O sistema possui **7+ IAs separadas**, cada uma com seu próprio edge function e contexto isolado:

```text
┌─────────────────────────────────────────────────┐
│  management-ai        → Copilot (16 tools)      │
│  marketing-post-chat  → Chat de Marketing       │
│  marketing-daily-suggestions → Feed diário       │
│  marketing-suggestions → Sugestões automáticas   │
│  ai-insights          → Insights do Dashboard    │
│  finance-categorize   → Categorização financeira │
│  whatsapp-webhook     → IA do WhatsApp           │
└─────────────────────────────────────────────────┘
```

## Objetivo

Um único Copiloto (`management-ai`) com **acesso total ao banco de dados** e capacidades expandidas, incluindo marketing. O widget `AICopilotWidget` na tela inicial passa a ser o ponto central de toda interação com IA.

## Mudanças Planejadas

### 1. Expandir `management-ai` com ferramentas de Marketing

Adicionar 2 novas tools ao edge function `management-ai`:

- **`create_marketing_post`** — Criar post para redes sociais com título, legenda, hashtags, image prompt e horário ideal. Busca produtos reais (`tablet_products`), identidade de marca (`brand_identity`), assets (`brand_assets`) e receitas para contexto.
- **`generate_daily_post_ideas`** — Gerar 3 sugestões de posts baseadas nos produtos reais e dados da marca.

O system prompt do `management-ai` será expandido para incluir o contexto de marketing (produtos do cardápio, identidade de marca, assets visuais) no bloco de dados.

### 2. Expandir o contexto (`copilot-context`)

Modificar o edge function `copilot-context` para também retornar:
- Produtos do cardápio (`tablet_products`) — nome, preço, categoria, destaque
- Identidade de marca (`brand_identity`) — tom de voz, tagline, cores, redes sociais
- Assets visuais (`brand_assets`) — títulos e tipos disponíveis

### 3. Atualizar `PostAIChat` do Marketing

O componente `PostAIChat` (usado no `PostSheet`) será refatorado para usar o `management-ai` em vez do `marketing-post-chat`. Isso garante que ao criar posts dentro do módulo de Marketing, o mesmo Copiloto responde, com os mesmos dados e comportamento.

### 4. Manter edge functions especializadas como estão (por ora)

Os edge functions `marketing-daily-suggestions`, `ai-insights`, `finance-categorize` e `whatsapp-webhook` continuam existindo para seus fluxos automáticos (não são chat interativo). A unificação foca na **experiência de chat/interação** — um único Copiloto que sabe fazer tudo.

## Arquivos a Editar

| Arquivo | Mudança |
|---|---|
| `supabase/functions/management-ai/index.ts` | +2 tools de marketing, contexto de marca/produtos no prompt |
| `supabase/functions/copilot-context/index.ts` | +queries de produtos, marca e assets |
| `src/components/marketing/PostAIChat.tsx` | Usar `management-ai` via supabase.functions.invoke |
| `src/components/dashboard/AICopilotWidget.tsx` | Adicionar chip de sugestão "Criar post" |

## Resultado Final

O usuário pode, de qualquer lugar, conversar com o mesmo Copiloto e pedir:
- "Cria um post de promoção do X-Burguer" (marketing)
- "Registra despesa de R$500 de energia" (financeiro)
- "Como tá meu estoque?" (inventário)
- "Agenda reunião às 14h" (agenda)

Tudo no mesmo chat, mesmo contexto, mesma IA.

