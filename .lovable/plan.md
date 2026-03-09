

## Plano: Chat IA no PostSheet para criação de posts por prompt

### O que muda

A tela "Novo Post" ganha dois modos: **Manual** (formulário atual) e **IA** (chat com o agente). No modo IA, o usuário conversa com o agente que já tem acesso ao contexto da marca (RAG interno com brand_identity, produtos, assets). Botões de prompt pré-configurado aceleram a criação. Quando a IA gera um post, os campos (título, legenda, hashtags, imagem) são preenchidos automaticamente no formulário.

### Fluxo

```text
PostSheet abre → Toggle [Manual | IA]
                          ↓
    ┌──────────────────────────────────┐
    │  Botões rápidos:                 │
    │  [📸 Post de produto]            │
    │  [🔥 Promoção do dia]            │
    │  [📖 Storytelling]               │
    │  [📊 Enquete/Engajamento]        │
    │                                  │
    │  Chat com o agente               │
    │  ────────────────────            │
    │  🤖 "Baseado na sua marca..."    │
    │  ────────────────────            │
    │  [Usar este post] → preenche     │
    │  título, legenda, imagem etc     │
    └──────────────────────────────────┘
```

### Implementação

**1. Nova edge function `supabase/functions/marketing-post-chat/index.ts`**
- Recebe `unit_id` + `messages` (histórico do chat)
- Busca contexto da marca (mesmo RAG do `marketing-daily-suggestions`: brand_identity, products, assets, recipes)
- Chama Lovable AI (Gemini 3 Flash) com system prompt instruindo a gerar posts com dados reais
- Usa tool calling para retornar structured output: `{ title, caption, hashtags, image_prompt, channels }`
- Também suporta conversa livre (sem tool call forçado) para refinar ideias
- Streaming via SSE para feedback em tempo real

**2. Novo componente `src/components/marketing/PostAIChat.tsx`**
- Interface de chat compacta dentro do PostSheet
- Botões de prompt rápido no topo: "Post de produto", "Promoção do dia", "Storytelling", "Enquete"
- Renderiza mensagens com markdown (react-markdown já instalado)
- Quando a IA retorna um post estruturado, mostra botão "Usar este post" que chama `onApplyPost(data)` para preencher os campos do formulário

**3. Editar `src/components/marketing/PostSheet.tsx`**
- Adicionar toggle Manual/IA no header
- Estado `mode: 'manual' | 'ai'`
- Quando mode=ai, renderiza `<PostAIChat>` no lugar do formulário
- Callback `onApplyPost` que: seta título, legenda, tags, media e volta para mode=manual com campos preenchidos

**4. Sem mudanças no banco** — usa tabelas existentes como contexto (brand_identity, tablet_products, brand_assets, recipes)

### Arquivos

- **Criar**: `supabase/functions/marketing-post-chat/index.ts`, `src/components/marketing/PostAIChat.tsx`
- **Editar**: `src/components/marketing/PostSheet.tsx`, `supabase/config.toml`

