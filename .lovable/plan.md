

## Plano: Sistema de Fechamento de Conta no Tablet + Fundação de Moedas/Cashback

### Escopo Fase 1 (agora)
Sistema de fechamento de conta na mesa via tablet: o cliente vê o resumo dos pedidos da mesa, escolhe forma de pagamento (Pix com QR code no tablet, ou pagamento online via login), e um garçom finaliza.

### Escopo Fase 2 (futuro, fundação agora)
Sistema de moedas internas (coins) — cashback por compra, bônus por cadastro, feedback, etc. O cliente acumula moedas e troca por produtos. A fundação será o campo `loyalty_points` já existente no `customers`, renomeado conceitualmente para "moedas".

---

### Mudanças

**1. Migração DB**
- Adicionar campo `pix_key` (text) na `store_info` JSON da unidade (configurável nas settings)
- Adicionar campo `pix_key_type` (text: cpf, cnpj, email, telefone, aleatoria)
- Criar tabela `table_bills` para agrupar pedidos de uma mesa em uma conta:
  - `id`, `unit_id`, `table_number`, `customer_id` (nullable), `status` (open/paid/cancelled), `total`, `payment_method`, `paid_at`, `created_at`
- Ou reutilizar a lógica existente de `tablet_orders` agrupando por mesa + status

**2. Nova página: `/tablet/:unitId/bill` — Fechamento de Conta**
- Acesso via botão "Minha Conta" no TabletHome (que hoje não faz nada)
- Busca todos os `tablet_orders` da mesa atual com status `confirmed`/`preparing`/`ready`
- Exibe resumo: lista de itens agrupados, subtotal, total
- Opções de pagamento:
  - **Pix**: gera QR code usando `qrcode.react` (já instalado) com payload Pix estático (chave da loja configurada em `store_info.pix_key`)
  - **Chamar garçom**: marca a conta como "aguardando pagamento" para o garçom receber na mesa (dinheiro, cartão, etc.)
  - **Pagar com saldo/moedas**: se logado e tiver saldo suficiente, desconta dos pontos
- Após pagamento confirmado, marca os pedidos como `paid`

**3. TabletHome — Ativar botão "Minha Conta"**
- Navegar para `/tablet/:unitId/bill?mesa=X`
- Mostrar badge com quantidade de pedidos abertos na mesa

**4. Configurações — Chave Pix**
- Adicionar campo de chave Pix nas configurações do cardápio/loja (`CardapioSettings` ou `StoreSettings`)
- Salvar em `store_info.pix_key` e `store_info.pix_key_type`

**5. Componente `TabletBillPage`**
- Resumo visual dos pedidos da mesa (cards com itens, quantidades, preços)
- Seção de pagamento com 3 opções (chips):
  - 🟢 Pix → mostra QR code inline
  - 🔵 Chamar garçom → envia notificação/marca status
  - 🟡 Pagar com moedas → (se logado, mostra saldo e botão de confirmar)
- Botão de login rápido se não estiver logado (reutiliza CustomerAuthBanner)

### Arquivos a Criar/Editar
| Arquivo | Ação |
|---|---|
| `src/pages/TabletBill.tsx` | Criar — página de fechamento de conta |
| `src/pages/TabletHome.tsx` | Editar — ativar botão "Minha Conta" com navegação |
| `src/App.tsx` | Editar — adicionar rota `/tablet/:unitId/bill` |
| Migração SQL | Criar — campo pix_key no store_info (via docs/settings) |
| Settings (CardapioSettings ou Store) | Editar — input de chave Pix |

### Geração do QR Code Pix
Usa o padrão BR Code (Pix estático) com a chave da loja. O payload será construído em código (sem API externa) usando o formato EMV padrão do Banco Central. O `QRCodeSVG` já instalado renderiza o QR.

