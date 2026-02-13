

# Base de Conhecimento do Restaurante para a IA

## Problema
Atualmente a IA do WhatsApp so tem acesso ao cardapio (`tablet_products`) e ao historico da conversa. Ela nao sabe responder perguntas gerais como horario de funcionamento, endereco, formas de pagamento, tempo de entrega, politica de cancelamento, etc.

## Solucao
Criar uma tabela `whatsapp_knowledge_base` onde o admin cadastra "artigos" de conhecimento que a IA consulta automaticamente antes de responder.

---

## Etapa 1: Banco de Dados

### Nova tabela: `whatsapp_knowledge_base`
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| unit_id | uuid | FK para units |
| title | text | Titulo do artigo (ex: "Horario de Funcionamento") |
| content | text | Conteudo completo que a IA vai ler |
| category | text | Categoria livre (ex: "geral", "entrega", "pagamento") |
| is_active | boolean | Ativa/desativa o artigo |
| sort_order | integer | Ordem de exibicao |
| created_at | timestamptz | Timestamp |
| updated_at | timestamptz | Timestamp |

- RLS: leitura e escrita restrita a admins
- Realtime habilitado

### Exemplos de artigos pre-cadastrados (sugestao na interface):
- Horario de Funcionamento
- Endereco e Localizacao
- Formas de Pagamento
- Tempo de Entrega
- Taxa de Entrega
- Politica de Cancelamento
- Informacoes sobre Alergenos
- Contato / Redes Sociais

---

## Etapa 2: Interface Administrativa

### Nova aba "Base de Conhecimento" na pagina `/whatsapp`
- Lista de artigos com titulo, categoria e toggle ativo/desativo
- Sheet para criar/editar artigo com:
  - Titulo
  - Categoria (select com opcoes comuns + campo livre)
  - Conteudo (textarea grande)
  - Toggle ativo/desativo
- Botao para adicionar novo artigo
- Sugestoes de artigos comuns para facilitar o preenchimento

---

## Etapa 3: Integracao com a IA

### Modificacao na Edge Function `whatsapp-webhook`
- Antes de chamar a IA, buscar todos os artigos ativos da `whatsapp_knowledge_base` filtrados por `unit_id`
- Incluir no system prompt da IA uma secao:

```text
BASE DE CONHECIMENTO DO RESTAURANTE:

[Horario de Funcionamento]
Segunda a Sexta: 11h as 23h
Sabados: 11h as 00h
Domingos: 12h as 22h

[Formas de Pagamento]
Aceitamos Pix, cartao de credito/debito e dinheiro.
...
```

- A IA consulta essa base antes de responder qualquer pergunta geral

---

## Etapa 4: Hook

### Adicionar ao `useWhatsApp.ts`:
- `useWhatsAppKnowledge()` -- CRUD de artigos com React Query

---

## Arquivos modificados/criados

| Arquivo | Mudanca |
|---|---|
| Nova migracao SQL | Tabela `whatsapp_knowledge_base` + RLS |
| `src/types/whatsapp.ts` | Novo tipo `WhatsAppKnowledgeArticle` |
| `src/hooks/useWhatsApp.ts` | Novo hook `useWhatsAppKnowledge` |
| `src/components/whatsapp/WhatsAppKnowledge.tsx` | **Novo** - Interface de gestao da base |
| `src/pages/WhatsApp.tsx` | Adicionar aba "Base de Conhecimento" |
| `supabase/functions/whatsapp-webhook/index.ts` | Buscar artigos e incluir no prompt da IA |

