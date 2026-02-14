

# Modulo de Marketing: Planejamento e Publicacao de Conteudo

## Visao Geral

Criar um modulo completo de Marketing para planejar, organizar e publicar conteudos no **Instagram** e **WhatsApp Status**, com foco em rapidez de execucao e organizacao visual por calendario.

## Estrutura do Modulo

### 1. Tabela `marketing_posts` (banco de dados)

Armazena todos os posts planejados com os seguintes campos:
- `id`, `unit_id`, `user_id` (multi-tenant padrao)
- `title` - titulo interno do post
- `caption` - legenda/texto do post
- `media_urls` - array de URLs das imagens/videos (bucket de storage)
- `channels` - array de canais alvo (`['instagram', 'whatsapp_status']`)
- `status` - enum: `draft` (rascunho), `scheduled` (agendado), `published` (publicado), `failed` (erro)
- `scheduled_at` - data/hora do agendamento (opcional, para organizacao)
- `published_at` - data/hora da publicacao efetiva
- `tags` - array de tags para organizacao (ex: "promocao", "cardapio", "novidade")
- `notes` - anotacoes internas
- `sort_order`, `created_at`, `updated_at`

### 2. Storage Bucket `marketing-media`

Bucket publico para armazenar imagens e videos dos posts, com RLS restrita a admins para upload e leitura publica para exibicao.

### 3. Pagina `/marketing` (nova)

Interface com tres visoes alternadas por tabs:

**Aba Calendario:**
- Visualizacao mensal com marcadores nos dias que tem posts agendados
- Clicar no dia exibe os posts daquele dia
- Indicador de cor por status (rascunho = cinza, agendado = azul, publicado = verde)

**Aba Feed (lista):**
- Lista vertical com preview dos posts (imagem + titulo + legenda truncada)
- Filtro por status (Todos, Rascunhos, Agendados, Publicados)
- Filtro por canal (Instagram, WhatsApp)
- Cada card mostra: thumbnail, titulo, legenda, canais alvo, data, status

**Aba Ideias (rascunhos rapidos):**
- Campo rapido para anotar ideias de conteudo sem preencher tudo
- Converte para post completo com um toque

### 4. Sheet de Criacao/Edicao de Post

Bottom-sheet (padrao do app) com:
- Upload de imagens (multiplas, com preview e reordenacao)
- Campo de legenda com contador de caracteres
- Seletor de canais (Instagram, WhatsApp Status) com checkboxes visuais
- Date picker para agendar
- Campo de tags
- Campo de notas internas
- Botao "Salvar Rascunho" e "Publicar Agora"

### 5. Publicacao Rapida

**Instagram:**
- Como a API do Instagram (Meta Graph API) requer uma conta Business com token de acesso, a publicacao sera feita via **deep link** que abre o app do Instagram com a imagem pronta para postar
- O sistema copia automaticamente a legenda para a area de transferencia ao clicar "Publicar"
- Apos o usuario confirmar, marca o post como publicado no sistema

**WhatsApp Status:**
- Utiliza **deep link** do WhatsApp para compartilhar a imagem como Status
- A legenda e copiada automaticamente para a area de transferencia
- Apos o usuario confirmar, marca o post como publicado

Essa abordagem de deep links elimina a necessidade de APIs complexas e tokens, oferecendo a experiencia mais rapida possivel: **1 toque para abrir o app + colar legenda + publicar**.

### 6. Hook `useMarketing`

Hook com React Query seguindo o padrao ja refatorado:
- `useQuery` para listagem de posts com cache
- `useMutation` para criar, editar, excluir e marcar como publicado
- Filtros por mes, status e canal

### 7. Navegacao

- Adicionar item "Marketing" no menu lateral do `AppLayout` com icone `Megaphone`
- Rota protegida, somente admins
- Grupo "Gestao"

---

## Detalhes Tecnicos

### Tabela SQL

```text
marketing_posts (
  id uuid PK default gen_random_uuid(),
  unit_id uuid references units(id),
  user_id uuid not null,
  title text not null,
  caption text default '',
  media_urls text[] default '{}',
  channels text[] default '{}',
  status text default 'draft' check in ('draft','scheduled','published','failed'),
  scheduled_at timestamptz,
  published_at timestamptz,
  tags text[] default '{}',
  notes text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

RLS: admins podem tudo; funcionarios nao tem acesso (adminOnly).

### Deep Links usados

- Instagram: `instagram://library?AssetPath=<encoded_uri>` (fallback: abrir galeria e copiar legenda)
- WhatsApp: `whatsapp://send?text=<caption>` com intent de Status

### Arquivos a criar

1. `src/types/marketing.ts` - tipos TypeScript
2. `src/hooks/useMarketing.ts` - hook React Query
3. `src/pages/Marketing.tsx` - pagina principal
4. `src/components/marketing/MarketingCalendar.tsx` - visao calendario
5. `src/components/marketing/MarketingFeed.tsx` - visao lista/feed
6. `src/components/marketing/MarketingIdeas.tsx` - rascunhos rapidos
7. `src/components/marketing/PostSheet.tsx` - sheet de criacao/edicao
8. `src/components/marketing/PostCard.tsx` - card de preview do post
9. `src/components/marketing/PublishActions.tsx` - logica de deep links e publicacao rapida
10. Migracao SQL para tabela + bucket + RLS

### Arquivos a editar

1. `src/App.tsx` - adicionar rota `/marketing`
2. `src/components/layout/AppLayout.tsx` - adicionar item no menu

