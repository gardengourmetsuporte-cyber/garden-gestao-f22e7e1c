

# Integração ASAAS para Pagamento Online

## Resumo
Integrar a API do ASAAS para gerar links de pagamento (Pix, Cartão, Boleto) nos 3 canais de pedido: Cardápio Digital (`/m/:unitId`), Tablet (`/tablet/:unitId`) e QR Code. O cliente escolhe a forma de pagamento online no checkout, o sistema gera a cobrança via ASAAS e redireciona/exibe o link de pagamento.

## Arquitetura

```text
┌─────────────────────┐
│  MenuCart / Tablet   │──► Edge Function ──► ASAAS API v3
│  / QR Code Checkout  │       │                  │
└─────────────────────┘       │            ┌─────┴─────┐
                              │            │ Payment   │
                              │            │ Link/QR   │
                              │            └───────────┘
                              ▼
                    tablet_orders.payment_status
                    tablet_orders.payment_link
                    tablet_orders.asaas_payment_id
```

## Etapas

### 1. Configuração do Secret ASAAS
- Solicitar a API Key do ASAAS ao usuário via `add_secret` (chave: `ASAAS_API_KEY`)
- Armazenar a URL base (`https://api.asaas.com` para produção ou `https://sandbox.asaas.com/api` para testes)

### 2. Tabela de Configuração ASAAS (migration)
- Adicionar colunas na tabela `tablet_orders`:
  - `payment_method` (text) — `pix`, `credit_card`, `boleto`, `presencial`
  - `payment_status` (text) — `pending`, `confirmed`, `received`, `overdue`
  - `payment_link` (text) — URL do link de pagamento ASAAS
  - `asaas_payment_id` (text) — ID da cobrança no ASAAS
- Criar tabela `asaas_config` por unidade:
  - `unit_id`, `api_key_encrypted`, `environment` (sandbox/production), `is_active`, `wallet_id`

### 3. Edge Function: `asaas-payment`
Ações:
- **`create-payment`**: Recebe `order_id`, cria cliente no ASAAS (ou busca existente por CPF/email), cria cobrança com `billingType` escolhido (PIX/CREDIT_CARD/BOLETO), retorna link de pagamento + QR code Pix
- **`check-status`**: Consulta status da cobrança no ASAAS e atualiza `tablet_orders`
- **`webhook`**: Recebe webhooks do ASAAS para atualizar status automaticamente (PAYMENT_RECEIVED, PAYMENT_CONFIRMED)

### 4. Fluxo no Checkout (MenuCart + TabletMenuCart)
- Adicionar seleção de forma de pagamento: "Pagar na hora" vs "Pagar Online (Pix/Cartão/Boleto)"
- Se pagamento online:
  1. Criar pedido com status `awaiting_payment`
  2. Chamar edge function `asaas-payment?action=create-payment`
  3. Exibir tela de pagamento: QR Code Pix / link de cartão / boleto
  4. Polling ou realtime para detectar confirmação
  5. Ao confirmar, atualizar status do pedido para `confirmed`

### 5. Webhook para Confirmação Automática
- Registrar URL do webhook no ASAAS: `{SUPABASE_URL}/functions/v1/asaas-payment?action=webhook`
- Validar assinatura do webhook
- Atualizar `tablet_orders.payment_status` e `status` automaticamente

### 6. UI de Pagamento
- Componente `OnlinePaymentSheet`: exibe QR Pix, link de cartão, ou boleto
- Timer de expiração (Pix expira em 30 min)
- Indicador visual de "Aguardando pagamento" com auto-refresh
- Tela de sucesso ao confirmar

## Detalhes Técnicos
- ASAAS API v3: `POST /v3/payments` para cobranças, `POST /v3/customers` para clientes
- `billingType`: `UNDEFINED` (cliente escolhe), `PIX`, `CREDIT_CARD`, `BOLETO`
- Para Pix: resposta inclui `pixQrCodeUrl` e `pixCopiaECola`
- A API Key do ASAAS pode ser por unidade (multi-tenant) ou global

## Segurança
- API Key armazenada como secret no edge function, nunca exposta ao frontend
- Webhook validado por token/IP
- RLS mantido nas tabelas existentes

