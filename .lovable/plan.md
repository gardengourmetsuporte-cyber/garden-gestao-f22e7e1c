

# Plano de Integração Garden + Colibri POS (Windows)

## Contexto da Pesquisa

Após estudar toda a documentação disponível do Colibri, identifiquei o seguinte:

- O **Colibri POS (Windows)** é um sistema local, sem API REST pública direta
- A integração com sistemas externos acontece via um middleware: o **Gestor de Pedidos** (que você já possui) ou o mais recente **DeliveryTunnel**
- O Gestor de Pedidos se comunica com o servidor Colibri na rede local e expõe uma API HTTP para receber pedidos externos
- Produtos são mapeados via **Código ERP** (campo `codigo_pdv` que já existe no nosso sistema)
- O sistema atual já tem a estrutura base de integração na aba "PDV" do TabletAdmin (URL do Hub + Auth Key)

## Limitação Importante

O Colibri **não possui uma API REST pública na nuvem**. A comunicação passa pelo Gestor de Pedidos rodando na rede local do restaurante. Isso significa que:

1. **Enviar pedidos do Tablet ao Colibri** -- possível, desde que a URL do Gestor de Pedidos esteja acessível (rede local ou com túnel/DDNS configurado)
2. **Sincronizar produtos/cardápio do Colibri** -- o Colibri não expõe endpoint de consulta de cardápio via API. Precisaria ser feito manualmente ou via importação CSV
3. **Puxar dados de vendas/relatórios do Colibri** -- não disponível via API. O Colibri não expõe endpoints de leitura de vendas para sistemas externos

## O que podemos implementar

### 1. Melhorar o envio de pedidos ao Colibri (já parcialmente implementado)
- Adicionar suporte a **produtos combo** (prefixo `CMB-`)
- Adicionar campo de **código de pagamento** para mapear formas de pagamento
- Melhorar feedback visual de status da integração
- Adicionar logs detalhados de envio/erro
- Adicionar **teste de conexão** na tela de configuração PDV

### 2. Guia de configuração integrado
- Wizard passo-a-passo na aba PDV explicando como obter a URL e chave do Gestor de Pedidos
- Link para download do DeliveryTunnel (nova versão recomendada pela Colibri)

### 3. Mapeamento de produtos aprimorado
- Validação visual de quais produtos têm/não têm código PDV
- Alerta quando um pedido contém itens sem código PDV

---

## Implementação Proposta

### Etapa 1: Melhorar a tela de configuração PDV
- Adicionar botão "Testar Conexão" que faz um health-check na URL do Hub
- Adicionar guia visual com os passos de configuração do Gestor de Pedidos/DeliveryTunnel
- Adicionar campo para código de pagamento padrão (online)

### Etapa 2: Melhorar o envio de pedidos
- Atualizar a Edge Function `tablet-order` para suportar combos (prefixo `CMB-`)
- Adicionar campo `payment_code` ao payload enviado
- Implementar retry automático (até 5 tentativas, como o Colibri recomenda)
- Salvar log completo de request/response na tabela `tablet_orders`

### Etapa 3: Dashboard de status da integração
- Indicador visual de "conexão ativa" com o PDV
- Contadores de pedidos enviados/com erro do dia
- Lista de pedidos pendentes de reenvio

### Etapa 4: Validação de produtos
- Badge visual na lista de produtos indicando se o código PDV está preenchido
- Alerta no momento do envio se há itens sem código

### Detalhes Técnicos
- Modificar `supabase/functions/tablet-order/index.ts` para suportar combos e retry automático
- Adicionar coluna `payment_code` na tabela `tablet_pdv_config`
- Adicionar coluna `retry_count` na tabela `tablet_orders`
- Atualizar `src/pages/TabletAdmin.tsx` com os novos componentes de configuração e status
- Criar Edge Function `colibri-health` para teste de conexão
