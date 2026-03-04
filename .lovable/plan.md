

# Brand Core — Central de Branding Inteligente

## Contexto
Você não tem acesso à Meta Marketing API ainda (requer App Review que leva semanas). Vamos começar pelo **Brand Core** que é 100% viável agora e será a base para qualquer integração futura de tráfego.

O módulo de IA de Tráfego (Meta Ads) será um roadmap futuro — quando você tiver o App ID aprovado pela Meta, criaremos a integração OAuth e o painel de campanhas.

## O que será construído

### 1. Banco de dados — Tabelas novas
- **`brand_assets`** — Fotos, logos, manuais (tipo, URL no storage, tags, descrição)
- **`brand_identity`** — Cores, tipografia, tom de voz, frases institucionais, slogan (1 registro por unidade)
- **`brand_references`** — Referências visuais, estratégias, histórico de campanhas

### 2. Storage
- Bucket **`brand-assets`** (público) para logos, fotos de produtos, ambiente, cardápio

### 3. Página Brand Core (`/brand-core`)
Nova rota dentro do módulo Marketing com 3 abas:
- **Identidade** — Cores da marca, tipografia, tom de voz, frases, slogan
- **Galeria** — Upload e organização de fotos (logo, produtos, ambiente, cardápio) com tags
- **Referências** — Estratégias de marketing, referências visuais, histórico

### 4. IA integrada (Lovable AI)
Edge Function **`brand-ai-generate`** que:
- Lê a identidade da marca + assets do banco
- Gera copies padronizadas no tom de voz da marca
- Sugere criativos com base nas fotos e produtos reais
- Gera prompts otimizados para ferramentas de design
- Integra com o módulo de Marketing existente (ao criar post, puxa contexto do Brand Core)

### 5. Integração com módulos existentes
- **Marketing** → Ao gerar ideias IA, usa dados do Brand Core como contexto
- **Cardápio** → Puxa fotos de produtos automaticamente para a galeria

## Detalhes técnicos

### Estrutura do banco
```text
brand_identity (1 por unit)
├── colors (jsonb: primary, secondary, accent, bg)
├── typography (jsonb: headings, body)
├── tone_of_voice (text)
├── tagline (text)
├── institutional_phrases (text[])
└── unit_id (fk)

brand_assets
├── type (enum: logo, product_photo, environment, menu, manual, reference)
├── file_url (text)
├── title, description, tags (text[])
└── unit_id (fk)

brand_references
├── type (enum: strategy, campaign_history, visual_reference)
├── title, content (text)
├── media_urls (text[])
└── unit_id (fk)
```

### RLS
- Filtro por `user_has_unit_access` em todas as tabelas
- Políticas CRUD para membros autenticados da unidade

### Edge Function `brand-ai-generate`
- Recebe `action` (generate_copy, suggest_creative, generate_prompt)
- Consulta `brand_identity` + `brand_assets` da unidade
- Envia contexto completo para Lovable AI (Gemini)
- Retorna sugestões formatadas

### Módulo no sistema
- Adicionado ao `ALL_MODULES` como submódulo de Marketing ou módulo independente
- Acessível via aba dentro de Marketing ou rota dedicada

## Sobre a IA de Tráfego (Meta Ads) — Roadmap
Isso será fase 2. Quando você tiver:
1. Conta Business Manager da Meta
2. App ID criado no Meta for Developers
3. App Review aprovado (permissões: `ads_management`, `ads_read`, `business_management`)

Aí criaremos: OAuth flow via Edge Function, sincronização de campanhas, dashboard de métricas e otimização automática.

