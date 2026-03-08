

## Portal do Fornecedor — Dashboard de Vendas

### Visão Geral

Expandir a página pública de cotação (`/cotacao/:token`) para um **Portal do Fornecedor** completo, acessível via token permanente por fornecedor. O portal funcionará como um dashboard onde o fornecedor acompanha pedidos, boletos/faturas e pagamentos em tempo real.

### Arquitetura

```text
┌─────────────────────────────────────┐
│  /fornecedor/:token                 │
│  (Nova rota pública)                │
│                                     │
│  ┌──────────┬──────────┬──────────┐ │
│  │ Resumo   │ Pedidos  │ Boletos  │ │
│  │ (cards)  │ (lista)  │ (lista)  │ │
│  └──────────┴──────────┴──────────┘ │
│                                     │
│  Auth: telefone do fornecedor       │
│  Realtime: supplier_invoices        │
└─────────────────────────────────────┘
```

### Mudanças no Banco de Dados

1. **Adicionar coluna `portal_token` na tabela `suppliers`** (uuid, unique, default `gen_random_uuid()`):
   - Token permanente por fornecedor para acesso ao portal
   - Diferente do token de cotação (que é por cotação)

2. **Habilitar realtime na tabela `supplier_invoices`**:
   - `ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_invoices;`
   - Permite que o fornecedor veja pagamentos atualizados instantaneamente

### Nova Edge Function: `supplier-portal`

Endpoint público (sem JWT) que valida pelo `portal_token` do fornecedor.

**Ações:**
- `GET ?token=xxx` — Retorna dados do fornecedor + resumo
- `GET ?token=xxx&action=orders` — Lista pedidos do fornecedor com status
- `GET ?token=xxx&action=invoices` — Lista boletos/faturas com status de pagamento
- `GET ?token=xxx&action=verify-phone&phone=xxx` — Autenticação por telefone (mesmo padrão da cotação)

**Dados retornados no resumo:**
- Total vendido (mês atual)
- Boletos pendentes (quantidade + valor)
- Boletos vencidos
- Próximo vencimento

### Nova Página: `SupplierPortal.tsx`

**Rota:** `/fornecedor/:token` (pública, sem auth do app)

**Abas:**
1. **Resumo** — Cards com totais: vendas do mês, pendências, vencidos
2. **Pedidos** — Lista de pedidos (orders) com status (Rascunho → Enviado → Recebido), data, itens
3. **Faturas** — Lista de boletos (supplier_invoices) com badge pago/pendente/vencido, valor, vencimento. Atualização em tempo real via Supabase Realtime

**Autenticação:** Mesmo fluxo de verificação por telefone já usado na cotação pública. Sessão salva no localStorage por 90 dias.

### Integração com Cotações

Na página de cotação existente (`/cotacao/:token`), adicionar um link/botão "Ver meu Portal" que redireciona para `/fornecedor/:portalToken` (o `portal_token` será retornado pela edge function de cotação quando o fornecedor estiver autenticado).

### Compartilhamento do Link

No painel admin (lista de fornecedores ou detalhe do pedido), adicionar botão para copiar/enviar o link do portal do fornecedor via WhatsApp.

### Arquivos Envolvidos

| Arquivo | Ação |
|---|---|
| `supabase/functions/supplier-portal/index.ts` | Criar — Edge function do portal |
| `src/pages/SupplierPortal.tsx` | Criar — Página pública do portal |
| `src/App.tsx` | Editar — Adicionar rota `/fornecedor/:token` |
| `supabase/functions/quotation-public/index.ts` | Editar — Retornar `portal_token` no GET |
| Migration SQL | Criar — Adicionar `portal_token` em `suppliers`, habilitar realtime |

