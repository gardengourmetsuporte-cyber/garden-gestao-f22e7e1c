

# Redesign do Modulo de Marketing -- Gestor de Conteudo Inteligente

Inspirado no calendário de conteúdo do Canva, o módulo será reconstruído com um calendário mensal visual como peça central, sugestões inteligentes de datas comemorativas e conteúdos via IA, e uma experiência mobile-first.

---

## Visao Geral

O módulo terá 3 abas: **Calendário** (visão mensal tipo Canva), **Feed** (lista filtrada) e **Ideias IA** (sugestões inteligentes). O calendário deixa de usar o componente `react-day-picker` e passa a ser um grid customizado que mostra mini-cards dos posts em cada dia.

---

## 1. Calendário Mensal Visual (estilo Canva)

**Componente:** `MarketingCalendarGrid.tsx` (substitui `MarketingCalendar.tsx`)

- Header com navegação de mês (setas esquerda/direita + "Hoje")
- Grid 7 colunas (seg-dom) com células clicáveis
- Cada célula mostra:
  - Número do dia
  - Mini-chips coloridos dos posts agendados (max 2-3 visíveis + "+N")
  - Indicador de data comemorativa (badge especial)
- Ao clicar numa célula, abre uma bottom sheet com os posts daquele dia + botão "Novo post"
- Posts podem ser arrastados entre dias (drag-and-drop com dnd-kit) para reagendar
- Cores por status: rascunho (cinza), agendado (primary/cyan), publicado (verde)

## 2. Datas Comemorativas e Sugestões Inteligentes

**Componente:** `MarketingSmartSuggestions.tsx`

- Carrossel horizontal no topo (igual ao Canva) com sugestões contextuais:
  - Datas comemorativas do mês (hardcoded + IA para relevância do nicho)
  - "Crie um post para o Dia das Mães", "Promoção de Carnaval"
- Ao clicar numa sugestão, abre o PostSheet pre-preenchido com a data e título sugerido

**Backend:** Edge function `marketing-suggestions` usando Lovable AI para gerar:
- Sugestões de conteúdo baseadas no tipo de negócio
- Legendas prontas para copiar
- Melhores horários para postar

**Tabela de datas comemorativas:** Lista estática em `src/lib/marketingDates.ts` com as principais datas do calendário brasileiro, organizadas por mês.

## 3. Aba Ideias IA (refeita)

**Componente:** `MarketingIdeasAI.tsx` (substitui `MarketingIdeas.tsx`)

- Campo de input: "Sobre o que você quer postar?"
- IA gera 3-5 sugestões de posts completos (título + legenda + hashtags + melhor horário)
- Botão "Agendar" em cada sugestão para criar o post direto
- Histórico das últimas sugestões geradas

## 4. PostSheet melhorado

- Adiciona seletor de horário (não só data)
- Preview visual do post (como ficaria no Instagram)
- Sugestão de hashtags via IA
- Indicador de "melhor horário para postar"

## 5. Feed (melhoria incremental)

- Mantém a estrutura atual do `MarketingFeed.tsx`
- Adiciona contadores por status no header dos filtros
- Adiciona busca por texto

---

## Detalhes Tecnicos

### Arquivos novos
- `src/components/marketing/MarketingCalendarGrid.tsx` -- Grid mensal customizado
- `src/components/marketing/MarketingSmartSuggestions.tsx` -- Carrossel de sugestões
- `src/components/marketing/MarketingIdeasAI.tsx` -- Geração de ideias via IA
- `src/components/marketing/DayPostsSheet.tsx` -- Sheet dos posts de um dia específico
- `src/lib/marketingDates.ts` -- Datas comemorativas brasileiras
- `supabase/functions/marketing-suggestions/index.ts` -- Edge function para IA

### Arquivos modificados
- `src/pages/Marketing.tsx` -- Reestruturar com novos componentes
- `src/components/marketing/PostSheet.tsx` -- Adicionar seletor de hora e preview
- `src/components/marketing/MarketingFeed.tsx` -- Adicionar busca e contadores
- `src/types/marketing.ts` -- Sem alterações na tabela (schema atual é suficiente)

### Arquivos removidos
- `src/components/marketing/MarketingCalendar.tsx` (substituído pelo Grid)
- `src/components/marketing/MarketingIdeas.tsx` (substituído pela versão IA)

### Banco de dados
- Nenhuma migração necessária -- a tabela `marketing_posts` já tem todos os campos necessários (scheduled_at com timestamp, status, channels, media_urls, tags)

### Edge Function: `marketing-suggestions`
- Usa Lovable AI (google/gemini-3-flash-preview)
- Recebe: mês/ano, tipo de negócio (opcional), tema desejado
- Retorna: array de sugestões com título, legenda, hashtags, data sugerida, horário ideal
- Sem streaming (resposta direta via tool calling para JSON estruturado)

### Fluxo do calendário
1. Usuário navega entre meses com setas
2. Vê grid com posts posicionados nos dias
3. Carrossel no topo mostra datas importantes do mês + sugestões
4. Clica num dia -> abre sheet com posts do dia + opção de criar novo
5. Pode arrastar post de um dia para outro para reagendar

