

## Reestruturar Modulo Marketing — Hub Unificado com IA Generativa

### Problemas Atuais
- **Duplicidade**: Brand Core e Marketing sao paginas separadas com funcionalidades sobrepostas (IA em ambos, galeria de assets separada dos posts)
- **Fluxo lento**: Criar post exige muitos passos manuais
- **IA desconectada**: `marketing-suggestions` usa so cardapio; `brand-ai-generate` usa so brand. Nenhum cruza tudo
- **Sem sugestoes diarias automaticas**: Usuario precisa ir ate a aba IA e pedir manualmente
- **Sem geracao de imagem**: So gera texto, nao criativos visuais

### Nova Arquitetura — 1 Pagina, 3 Abas

```text
/marketing (pagina unica)
├── [1] Hoje           → Sugestoes diarias IA + feed rapido do dia
├── [2] Calendario     → Grade mensal com posts + feriados
├── [3] Marca          → Identidade + Galeria + Links (Instagram/Site)
```

**Brand Core (`/brand-core`) sera eliminado** — tudo fica dentro da aba "Marca".

### Aba "Hoje" (Nova — Tela Principal)

- **Sugestao do Dia**: IA gera automaticamente 2-3 sugestoes baseadas em:
  - Data de hoje (feriados, datas comerciais de `marketingDates.ts`)
  - Cardapio (`tablet_products` — pratos com foto, destaques, precos)
  - Fichas tecnicas (`recipes` — custo por porcao, ingredientes)
  - Brand identity (tom de voz, cores, frases)
  - Brand assets (fotos reais da marca para referencia visual)
  - Link do Instagram e site (se cadastrados)
- **Card de sugestao**: Titulo + legenda + hashtags + **imagem IA gerada** (usando `google/gemini-3.1-flash-image-preview`)
- **Acao rapida**: Botao "Compartilhar" abre Web Share API direto (1 toque → Instagram)
- **Botao "Ajustar"**: Abre editor inline para editar legenda antes de compartilhar
- Cache de 24h (`staleTime`) para nao regenerar toda hora

### Aba "Calendario" (Simplificada)

- Mantem a grade mensal existente (`UnifiedMonthGrid`)
- Mantem sheet de posts do dia
- Remove `MarketingSmartSuggestions` (agora esta na aba "Hoje")
- Feriados/datas aparecem como emojis no grid (ja funciona)

### Aba "Marca" (Consolida Brand Core)

- **Secao 1 — Links**: Campos para Instagram URL e Site URL (novos campos em `brand_identity`)
- **Secao 2 — Identidade**: Cores, tipografia, tom de voz, frases (mesmo formulario atual, compactado)
- **Secao 3 — Galeria**: Assets visuais (mesmo grid atual)
- Sem aba "Referencias" separada — vira um tipo de asset
- Sem aba "IA" separada — IA e a aba "Hoje"

### Alteracoes no Backend

**1. Migration — adicionar campos em `brand_identity`:**
```sql
ALTER TABLE brand_identity 
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT '';
```

**2. Edge Function `marketing-daily-suggestions` (Nova):**
- Busca TODOS os dados do negocio: `brand_identity`, `brand_assets`, `tablet_products`, `recipes` (top 20 com custo), `marketingDates` do dia
- Gera 2-3 sugestoes contextuais com tool calling
- Retorna: titulo, legenda, hashtags, horario, prompt para imagem
- Usa `google/gemini-3-flash-preview` para texto

**3. Edge Function `marketing-generate-image` (Nova):**
- Recebe prompt otimizado da sugestao
- Usa `google/gemini-3.1-flash-image-preview` para gerar imagem
- Salva no bucket `marketing-media`
- Retorna URL publica

**4. Edge Function existente `marketing-suggestions` — sera substituida pela nova `marketing-daily-suggestions`**

**5. Edge Function existente `brand-ai-generate` — sera removida (funcionalidade absorvida)**

### Alteracoes Frontend

| Arquivo | Acao |
|---------|------|
| `src/pages/Marketing.tsx` | Refazer com 3 abas (Hoje/Calendario/Marca) |
| `src/pages/BrandCore.tsx` | Remover (rota redireciona para `/marketing?tab=marca`) |
| `src/components/marketing/MarketingDailyFeed.tsx` | **Novo** — Aba "Hoje" com sugestoes IA |
| `src/components/marketing/MarketingCalendarGrid.tsx` | Manter, remover `SmartSuggestions` |
| `src/components/marketing/MarketingBrandTab.tsx` | **Novo** — Consolida identidade + galeria + links |
| `src/components/marketing/QuickShareButton.tsx` | **Novo** — Compartilhamento rapido 1 toque |
| `src/components/marketing/AISuggestionCard.tsx` | **Novo** — Card de sugestao com imagem IA |
| `src/components/marketing/MarketingSmartSuggestions.tsx` | Remover (absorvido) |
| `src/components/marketing/MarketingIdeasAI.tsx` | Remover (absorvido) |
| `src/components/marketing/MarketingFeed.tsx` | Remover (feed integrado no calendario) |
| `src/components/brand/*` | Remover (absorvido) |
| `src/hooks/useMarketing.ts` | Adicionar `generateDailySuggestions`, `generateImage` |
| `src/hooks/useBrandCore.ts` | Manter, adicionar `instagram_url`, `website_url` |
| `src/lib/modules.ts` | Remover rota `/brand-core` |
| `src/App.tsx` (routes) | Redirecionar `/brand-core` → `/marketing` |

### Fluxo do Usuario

```text
1. Abre Marketing → Ve "Hoje"
2. IA ja mostra 2-3 sugestoes com imagem gerada
3. Clica "Compartilhar" → Web Share abre → Instagram
4. Ou clica "Ajustar" → Edita legenda → Compartilha
5. Post e salvo automaticamente como "publicado"
```

### Geracao de Imagem IA

A IA usara o modelo `google/gemini-3.1-flash-image-preview` para gerar criativos baseados em:
- Prompt descritivo gerado pelo modelo de texto
- Referencia de cores da marca
- Contexto do produto (nome, preco, descricao)

A imagem gerada sera exibida no card e o usuario pode compartilhar direto ou ajustar.

