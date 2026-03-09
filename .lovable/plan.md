

## Problema

A IA de marketing está gerando sugestões genéricas -- produtos inventados, promoções fictícias, valores aleatórios. O prompt atual já busca dados do banco (`tablet_products`, `recipes`, `brand_identity`, `brand_assets`), mas as instruções para a IA não são rigorosas o suficiente para forçar o uso exclusivo desses dados reais.

## Causa Raiz

1. O prompt permite que a IA "invente" produtos e preços quando os dados reais são poucos ou parecem insuficientes
2. Não há regra explícita proibindo a IA de criar itens fictícios
3. Faltam dados de promoções reais (cupons, combos, preços especiais) para a IA usar
4. O limite de 10 produtos no prompt é baixo -- pode omitir itens relevantes

## Plano de Ajuste

### 1. Reforçar o prompt da Edge Function `marketing-daily-suggestions`

Alterações no `systemPrompt`:

- Adicionar regra explícita: **"NUNCA invente produtos, preços ou promoções. Use APENAS os itens listados abaixo."**
- Aumentar limite de produtos de 10 para 20 no contexto
- Incluir todos os campos relevantes: categoria, grupo, destaque, disponibilidade
- Se não houver produtos cadastrados, a IA deve sugerir apenas posts de engajamento/bastidores (sem mencionar itens específicos)
- Adicionar regra: **"Valores de promoção devem ser calculados a partir dos preços reais listados (ex: 10% de desconto sobre o preço real)"**
- Incluir nome do restaurante/negócio a partir do `brand_identity` ou `units`

### 2. Enriquecer o contexto enviado para a IA

- Buscar também o nome da unidade (`units.name`) para personalizar
- Incluir categorias do cardápio (`menu_categories`) para contexto de agrupamento
- Incluir combos/destaques (`is_highlighted`) com ênfase especial

### 3. Melhorar o prompt de geração de imagem

- Incluir contexto da marca (cores, estilo) no prompt de imagem para manter identidade visual consistente
- Passar nome real do produto para a imagem ser fiel

### Arquivos modificados

- `supabase/functions/marketing-daily-suggestions/index.ts` -- prompt mais restritivo + mais dados do DB
- `supabase/functions/marketing-generate-image/index.ts` -- incluir contexto de marca no prompt de imagem

Deploy automático das duas funções após edição.

