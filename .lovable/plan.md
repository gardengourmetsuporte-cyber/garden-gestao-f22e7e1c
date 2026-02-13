

# Modulo: Cardapio Completo (Estilo Goomer)

## Visao Geral

Criar um modulo completo de gestao de cardapio inspirado no Goomer, substituindo o cadastro simples atual de `tablet_products` por uma estrutura hierarquica com categorias, subcategorias (grupos), produtos com imagens/descricoes ricas, e opcionais/complementos vinculaveis aos produtos. A estrutura do tablet para o cliente sera atualizada automaticamente.

---

## Analise das Telas do Goomer (referencia)

Com base nas capturas de tela enviadas, o sistema precisa de:

1. **Categorias principais** no menu lateral (Lanches, Acompanhamentos, Sobremesas, Bebidas, etc.) com icones e cores
2. **Grupos/subcategorias** dentro de cada categoria (Prato executivo, Economicos, Classicos, etc.) com badges "Delivery/retirada" e "Mesa", contagem de itens, e horario de disponibilidade
3. **Produtos** dentro de cada grupo com: imagem, nome, descricao, preco (unico ou personalizado), codigo PDV, contagem de opcionais vinculados, destaque, reordenamento via drag
4. **Opcionais** (complementos) como entidade separada: Grupos de opcionais com titulo-pergunta ("Acompanha salada?", "Adicional de Molhos", "Base", "Bebida"), cada um com:
   - Disponibilidade (Tablet / Delivery)
   - Minimo e maximo de selecoes
   - Opcao "Repetir opcao"
   - Lista de opcoes com nome, preco adicional, codigo PDV, disponibilidade
   - Vinculacao a multiplos produtos/categorias
5. **Abas do cardapio**: Cardapio Principal, Rodizio, Vinhos, Opcionais, Traducoes

---

## Etapa 1: Banco de Dados (4 novas tabelas + alteracao em 1)

### 1.1 Alteracao na tabela `tablet_products`
Adicionar colunas:
| Coluna | Tipo | Descricao |
|---|---|---|
| group_id | uuid (FK, nullable) | Grupo/subcategoria ao qual pertence |
| is_highlighted | boolean (default false) | Produto em destaque |
| is_18_plus | boolean (default false) | Produto para maiores de 18 |
| availability | jsonb (default '{"tablet":true,"delivery":true}') | Disponibilidade por canal |
| schedule | jsonb (nullable) | Horario de disponibilidade (ex: {"days":["qui","sab"],"start":"10:00","end":"15:30"}) |
| price_type | text (default 'fixed') | 'fixed' ou 'custom' |
| custom_prices | jsonb (nullable) | Array de precos personalizados [{label, code, price}] |

### 1.2 Nova tabela: `menu_categories`
Categorias principais do cardapio (Lanches, Bebidas, etc.)

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| unit_id | uuid | FK para units |
| name | text | Nome da categoria |
| icon | text | Nome do icone (Lucide) |
| color | text | Cor hex |
| sort_order | integer | Ordem |
| is_active | boolean | Ativa/desativa |
| created_at, updated_at | timestamptz | Timestamps |

### 1.3 Nova tabela: `menu_groups`
Subcategorias/grupos dentro de uma categoria (Economicos, Classicos, etc.)

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| unit_id | uuid | FK para units |
| category_id | uuid | FK para menu_categories |
| name | text | Nome do grupo |
| description | text (nullable) | Descricao |
| availability | jsonb | {"tablet":true,"delivery":true} |
| schedule | jsonb (nullable) | Horario de disponibilidade |
| sort_order | integer | Ordem |
| is_active | boolean | Ativo/desativo |
| created_at, updated_at | timestamptz | Timestamps |

### 1.4 Nova tabela: `menu_option_groups`
Grupos de opcionais/complementos ("Acompanha salada?", "Adicional de Molhos")

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| unit_id | uuid | FK para units |
| title | text | Titulo/pergunta (ex: "Acompanha salada?") |
| min_selections | integer (default 0) | Minimo de selecoes |
| max_selections | integer (default 1) | Maximo de selecoes |
| allow_repeat | boolean (default false) | Permitir repetir opcao |
| availability | jsonb | {"tablet":true,"delivery":true} |
| sort_order | integer | Ordem |
| is_active | boolean | Ativo |
| created_at, updated_at | timestamptz | Timestamps |

### 1.5 Nova tabela: `menu_options`
Opcoes individuais dentro de um grupo de opcionais

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| option_group_id | uuid | FK para menu_option_groups |
| name | text | Nome da opcao (ex: "Com salada") |
| price | numeric (default 0) | Preco adicional |
| codigo_pdv | text (nullable) | Codigo PDV |
| availability | jsonb | {"tablet":true,"delivery":true} |
| image_url | text (nullable) | Imagem opcional |
| sort_order | integer | Ordem |
| is_active | boolean | Ativo |
| created_at, updated_at | timestamptz | Timestamps |

### 1.6 Nova tabela: `menu_product_option_groups`
Tabela de vinculacao N:N entre produtos e grupos de opcionais

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK para tablet_products |
| option_group_id | uuid | FK para menu_option_groups |
| sort_order | integer | Ordem do opcional neste produto |

### Politicas RLS
- Todas as tabelas: leitura publica (para o cardapio do tablet funcionar sem login), escrita restrita a admins
- A tabela de vinculacao segue o mesmo padrao

### Realtime
- Habilitar realtime em `menu_categories`, `menu_groups`, `menu_option_groups` para atualizacoes em tempo real no admin

---

## Etapa 2: Interface Administrativa - Pagina de Cardapio

### 2.1 Nova rota `/cardapio` (protegida, admin only)
- Adicionada ao menu lateral no grupo "Operacao", substituindo ou complementando o "Pedidos Tablet"
- A aba "Produtos" do TabletAdmin atual sera migrada para este novo modulo

### 2.2 Layout principal (estilo Goomer - 2 paineis)

```text
+---------------------------+--------------------------------------+
| Categorias (sidebar)      |  Conteudo do grupo selecionado       |
|                           |                                      |
| [+] Nova Categoria        |  Nome do Grupo                       |
|                           |  Horario | Badges | N itens          |
| > Lanches           v     |  [+ Novo Produto] [Editar] [Excluir] |
|   - Prato executivo       |                                      |
|   - Economicos            |  Card Produto 1                      |
|   - Classicos             |  Card Produto 2                      |
| > Acompanhamentos   v     |  Card Produto 3                      |
| > Sobremesas        v     |  ...                                 |
| > Bebidas           v     |                                      |
+---------------------------+--------------------------------------+
```

### 2.3 Painel esquerdo - Arvore de categorias
- Lista de categorias com icone e cor
- Expansivel: ao clicar mostra os grupos da categoria
- Cada grupo mostra badges de disponibilidade ("Delivery/retirada", "Mesa") e contagem de itens
- Drag para reordenar categorias e grupos
- Menu de contexto (tres pontos) em cada item: Editar, Excluir
- Botao "+ Nova Categoria" no topo

### 2.4 Painel direito - Conteudo do grupo
Ao selecionar um grupo no painel esquerdo:
- Header com nome do grupo, horario de disponibilidade, badges, contagem de itens
- Toolbar: [+ Novo Produto] [Editar Grupo] [Duplicar] [Excluir]
- Lista de produtos com:
  - Handle de drag para reordenar
  - Imagem thumbnail (ou placeholder)
  - Nome e descricao (truncada)
  - Preco e codigo PDV
  - Badges de disponibilidade
  - Contagem de opcionais vinculados (ex: "2 opcionais")
  - Badge "Destaque" se aplicavel
  - Acoes: Editar, Filtrar opcionais, Visualizar, Duplicar, Excluir

### 2.5 Sheet de Produto (editar/criar)
Modal lateral (bottom sheet no mobile) com:
- Campo: Nome
- Campo: Descricao (textarea)
- Campo: Grupo (select com grupos disponiveis)
- Toggle: Produto para maiores de 18
- Secao Horario: "Sempre aberto" ou botao "Definir Horario" (abre sub-formulario com dias e horas)
- Secao Preco:
  - Radio: Unico / Personalizado
  - Se unico: campo com codigo PDV + preco
  - Se personalizado: lista dinamica de variacoes [{label, codigo, preco}]
- Upload de imagem do produto
- Toggle: Ativo/Inativo
- Botoes: Fechar | Salvar Alteracoes

### 2.6 Abas superiores
Seguindo o Goomer:
- **Cardapio Principal** - gestao completa de categorias/grupos/produtos
- **Opcionais** - gestao de grupos de opcionais e vinculacao a produtos

### 2.7 Aba Opcionais
- Lista de todos os grupos de opcionais
- Cada card mostra:
  - Titulo do grupo ("Acompanha salada?")
  - Badges de disponibilidade
  - Lista de opcoes com nome, preco e codigo PDV
  - Badge "Em N produtos" ou "Aplicar em produto"
  - Botoes: Editar, Menu de contexto
- Botao "Criar Novo" no topo
- Ao clicar "Aplicar em produto" ou "Em N produtos": abre dialog para vincular/desvincular o grupo de opcionais a categorias e produtos especificos (arvore com checkboxes, como na captura IMG_2836)

### 2.8 Sheet de Grupo de Opcionais (editar/criar)
- Campo: Titulo/pergunta
- Toggles: Disponivel nos Tablets / Disponivel no Delivery
- Campo: Minimo de selecoes
- Campo: Maximo de selecoes
- Toggle: Repetir opcao
- Secao Opcoes (lista dinamica):
  - Para cada opcao: toggles Tablet/Delivery, nome, preco (select: Gratuito/valor), botao excluir
  - Botao "+ Nova Opcao"
- Botoes: Fechar | Salvar

---

## Etapa 3: Atualizacao do Cardapio do Tablet (cliente)

### Modificar `TabletMenu.tsx` e `useTabletOrder.ts`
- Buscar produtos com a nova estrutura hierarquica (categorias > grupos > produtos)
- Renderizar categorias como secoes principais com grupos como subsecoes
- Ao adicionar ao carrinho, se o produto tem opcionais vinculados, abrir sheet de selecao de opcionais antes de confirmar
- Armazenar opcoes selecionadas no carrinho junto com o item
- Incluir opcionais no total do pedido e nos dados enviados ao PDV

---

## Etapa 4: Hooks

### Novos hooks:
- `useMenuCategories` -- CRUD de categorias com React Query
- `useMenuGroups` -- CRUD de grupos com React Query
- `useMenuOptionGroups` -- CRUD de grupos de opcionais com React Query
- `useMenuOptions` -- CRUD de opcoes individuais
- `useMenuProductOptions` -- Vinculacao produtos <> opcionais

### Modificacao no hook existente:
- `useTabletAdmin` -- atualizar `saveProduct` para incluir novos campos (group_id, availability, schedule, price_type, etc.)

---

## Etapa 5: Integracao com WhatsApp

A IA do WhatsApp ja consulta `tablet_products`. Com a nova estrutura, sera atualizado para:
- Incluir categorias e grupos na descricao do cardapio enviada a IA
- Incluir opcionais disponiveis para cada produto
- A IA podera perguntar sobre opcionais ao montar pedidos

---

## Arquivos que serao criados/modificados

### Novos arquivos:
| Arquivo | Descricao |
|---|---|
| `src/pages/MenuAdmin.tsx` | Pagina principal do modulo de cardapio |
| `src/components/menu/MenuCategoryTree.tsx` | Painel lateral com arvore de categorias/grupos |
| `src/components/menu/MenuGroupContent.tsx` | Painel direito com produtos do grupo |
| `src/components/menu/ProductSheet.tsx` | Sheet de criar/editar produto |
| `src/components/menu/OptionGroupSheet.tsx` | Sheet de criar/editar grupo de opcionais |
| `src/components/menu/OptionGroupList.tsx` | Aba de opcionais |
| `src/components/menu/LinkOptionsDialog.tsx` | Dialog para vincular opcionais a produtos |
| `src/components/menu/ProductCard.tsx` | Card de produto na listagem |
| `src/hooks/useMenuAdmin.ts` | Hooks para todas as novas tabelas |

### Arquivos modificados:
| Arquivo | Mudanca |
|---|---|
| `src/App.tsx` | Adicionar rota `/cardapio` |
| `src/components/layout/AppLayout.tsx` | Adicionar item no menu lateral |
| `src/pages/TabletMenu.tsx` | Atualizar para usar nova estrutura hierarquica |
| `src/hooks/useTabletOrder.ts` | Incluir logica de opcionais no carrinho |
| `supabase/functions/whatsapp-webhook/index.ts` | Incluir categorias e opcionais no contexto da IA |

---

## Resumo da Hierarquia de Dados

```text
menu_categories (Lanches, Bebidas, Sobremesas...)
  └── menu_groups (Economicos, Classicos, Hot Dog...)
        └── tablet_products (Classic, Original, Standard...)
              └── menu_product_option_groups (vinculacao N:N)
                    └── menu_option_groups ("Acompanha salada?", "Molhos"...)
                          └── menu_options (Com salada, Sem salada, Barbecue...)
```

---

## Nota sobre Migracao

Os produtos ja cadastrados em `tablet_products` que nao tem `group_id` continuarao funcionando normalmente. A interface permitira associa-los a grupos/categorias gradualmente. A categoria atual (campo `category` texto) sera mantida como fallback para retrocompatibilidade.

