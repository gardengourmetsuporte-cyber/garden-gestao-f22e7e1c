

## Plano: Cotação Global — Catálogo de Preços por Fornecedor

### Conceito

Uma nova modalidade de cotação chamada **"Pesquisa de Preços"** (ou Cotação Global). Diferente da cotação normal (itens específicos com quantidades), esta envia **toda a lista de estoque** para os fornecedores selecionados, onde cada um informa:
- Quais itens **fornece**
- O **preço unitário** de cada item
- A **marca** (opcional)

O resultado alimenta a tabela `supplier_last_prices` e permite visualizar um mapa completo de quem vende o quê e por quanto.

---

### O que será feito

**1. Nova tabela `price_surveys`**
Armazena as pesquisas de preço globais, separada das cotações normais.

```text
price_surveys
├── id (uuid PK)
├── user_id (uuid)
├── unit_id (uuid)
├── title (text)
├── status (draft | sent | completed)
├── notes (text)
├── created_at / updated_at
```

**2. Nova tabela `price_survey_suppliers`**
Link entre pesquisa e fornecedores, com token público.

```text
price_survey_suppliers
├── id (uuid PK)
├── survey_id → price_surveys
├── supplier_id → suppliers
├── token (uuid, default gen_random_uuid())
├── status (pending | responded)
├── responded_at (timestamptz)
```

**3. Nova tabela `price_survey_responses`**
Cada preço informado pelo fornecedor.

```text
price_survey_responses
├── id (uuid PK)
├── survey_supplier_id → price_survey_suppliers
├── item_id → inventory_items
├── unit_price (numeric)
├── brand (text)
├── has_item (boolean, default true)
├── created_at
```

**4. Edge Function `price-survey-public`**
- **GET**: Retorna todos os itens do estoque da unidade com suas categorias, agrupados para o fornecedor
- **POST**: Recebe as respostas do fornecedor, salva em `price_survey_responses` e faz upsert em `supplier_last_prices`

**5. Página pública do fornecedor (`/pesquisa/:token`)**
Interface interativa e mobile-first:
- Lista completa de itens **agrupados por categoria** do estoque
- Filtro de busca e filtro por categoria (chips horizontais)
- Toggle "Tenho este item" + campo de preço + marca
- Botão "Marcar todos como disponíveis" para agilizar
- Barra fixa inferior com progresso e botão de enviar

**6. Tela interna de resultados**
- Nova sub-aba dentro de Cotações ou acesso direto
- Grid comparativo: itens nas linhas × fornecedores nas colunas
- Destaque visual para menor preço por item
- Indicador de quais fornecedores têm cada item
- Possibilidade de **gerar pedido** direto a partir dos resultados (selecionar itens → criar rascunho para o fornecedor escolhido)

**7. Criação da pesquisa (Sheet no app)**
- Selecionar fornecedores (mín. 1, sem mínimo de 2 como cotação)
- Título e observações
- Envio do link via WhatsApp (mesmo padrão atual)
- Todos os itens do estoque são incluídos automaticamente

---

### Alterações técnicas

**Migração SQL:**
- 3 novas tabelas com RLS por `unit_id`
- Políticas baseadas em `user_has_unit_access`

**Novos arquivos:**
- `supabase/functions/price-survey-public/index.ts` — Edge function pública
- `src/pages/PriceSurveyPublic.tsx` — Página do fornecedor
- `src/components/orders/PriceSurveySheet.tsx` — Sheet de criação
- `src/components/orders/PriceSurveyList.tsx` — Listagem
- `src/components/orders/PriceSurveyDetail.tsx` — Comparativo de resultados
- `src/hooks/usePriceSurveys.ts` — Hook CRUD

**Arquivos editados:**
- `src/App.tsx` — Rota `/pesquisa/:token`
- `src/pages/Orders.tsx` — Nova aba ou botão para pesquisa de preços
- `supabase/config.toml` — JWT config para nova function

---

### Fluxo resumido

```text
Admin cria pesquisa → Seleciona fornecedores → Links gerados
         ↓
Fornecedor abre link → Vê lista completa por categoria
         ↓
Marca itens que tem → Informa preços → Envia
         ↓
Admin vê comparativo → Identifica melhor fornecedor por item
         ↓
Pode gerar pedido direto ou usar info para cotações futuras
```

