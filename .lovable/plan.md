

## Plano: Login do Fornecedor + Histórico de Preços na Cotação

### Problema Atual
- O fornecedor acessa a cotação via link público sem identificação persistente
- Preços anteriores não são carregados de cotações passadas (só da cotação atual)
- Cada nova cotação exige digitação manual de todos os preços

### Solução

**1. Autenticação simples do fornecedor (via PIN/telefone)**

Não vamos usar o sistema de auth do app (é para admins). Em vez disso, criaremos um login leve baseado no telefone do fornecedor:

- Nova tabela `supplier_sessions`: armazena `supplier_id`, `phone_hash`, `pin`, `session_token`, `expires_at`
- Fluxo: fornecedor abre o link → digita telefone → recebe PIN via WhatsApp (ou usa PIN fixo configurado) → sessão salva em `localStorage`
- Sessão válida por 90 dias, reconhecimento automático nas próximas visitas

**Simplificação recomendada**: Em vez de PIN via WhatsApp (complexo), usar **identificação por telefone + nome** — o fornecedor digita o telefone cadastrado e o sistema valida contra o `suppliers.phone`. É seguro o suficiente pois o link já é privado (token único).

**2. Tabela de histórico de preços por fornecedor**

Já existe `supplier_price_history` para itens do estoque, mas precisamos de um histórico específico para cotações:

- Na edge function `quotation-public`, ao submeter preços, salvar também em `supplier_price_history` (ou nova tabela `supplier_last_prices`) vinculando `supplier_id` + `item_id` + `unit_price` + `brand`
- Ao carregar nova cotação, buscar últimos preços desse fornecedor para cada item

**3. UI: "Repetir último preço"**

- Botão global "Usar últimos preços" que preenche todos os campos com o último preço registrado
- Badge por item mostrando "Último: R$ X,XX" para referência
- Fornecedor pode editar individualmente após preencher em lote

### Mudanças Técnicas

**Banco de dados (migração):**
```sql
-- Tabela para últimos preços do fornecedor (cache rápido)
CREATE TABLE public.supplier_last_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  unit_price numeric NOT NULL,
  brand text,
  last_quoted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, item_id)
);
-- RLS: anon pode ler/escrever (edge function usa service role)
```

**Edge function `quotation-public`:**
- GET: buscar `supplier_last_prices` para o supplier_id + item_ids da cotação → retornar como `last_prices`
- POST: após inserir `quotation_prices`, fazer UPSERT em `supplier_last_prices` com os novos preços
- Nova ação GET com `?token=X&action=verify-phone` para validar telefone do fornecedor

**Frontend `QuotationPublic.tsx`:**
- Tela de "login" simples: campo telefone → valida contra o cadastro do fornecedor
- Salvar `supplier_session` no localStorage (token + supplier_id)
- Botão "Repetir últimos preços" no topo
- Badge "Último: R$ X,XX" em cada item
- Preenchimento automático dos campos ao clicar

### Arquivos Modificados
1. **Nova migração SQL** — tabela `supplier_last_prices`
2. **`supabase/functions/quotation-public/index.ts`** — buscar/salvar últimos preços, verificar telefone
3. **`src/pages/QuotationPublic.tsx`** — tela de login por telefone, botão "repetir preços", badges de último preço

