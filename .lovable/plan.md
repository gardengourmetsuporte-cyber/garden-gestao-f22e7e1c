

## Plan: Envio de Mensagens em Massa para Clientes por Segmento

### Objetivo
Permitir enviar mensagens WhatsApp (promoções, convites de retorno, etc.) para clientes filtrados por segmento (inativos, VIP, etc.) diretamente do módulo de Clientes.

### Arquitetura

```text
Customers Page
  └─ [Botão "Enviar mensagem"] (aparece quando segmento está filtrado)
       └─ MessageCampaignSheet (novo componente)
            ├── Mostra destinatários (clientes com telefone no filtro ativo)
            ├── Campo de mensagem com templates rápidos
            ├── Preview da mensagem
            └── Botão enviar
                 └─ Edge Function "whatsapp-bulk-send" (nova)
                      ├── Recebe: unit_id, phones[], message
                      ├── Busca canal WhatsApp ativo da unidade
                      ├── Envia mensagem para cada telefone via provider
                      ├── Salva log de campanha (nova tabela)
                      └── Retorna resultado (enviados/erros)
```

### Etapas de Implementação

1. **Criar tabela `customer_campaigns`** para registrar campanhas enviadas (unit_id, segment, message, total_sent, created_at, created_by)

2. **Criar edge function `whatsapp-bulk-send`** que:
   - Recebe lista de telefones + mensagem + unit_id
   - Busca o canal WhatsApp ativo da unidade
   - Envia mensagem para cada telefone via Evolution/Z-API
   - Registra campanha na tabela
   - Inclui delay entre envios para evitar bloqueio

3. **Criar componente `MessageCampaignSheet`** com:
   - Resumo dos destinatários (ex: "12 clientes inativos com telefone")
   - Templates rápidos (ex: "Sentimos sua falta!", "Promoção especial para você!")
   - Campo editável para personalizar a mensagem
   - Botão de envio com confirmação

4. **Integrar na página Customers** adicionando botão de ação quando houver filtro de segmento ativo, abrindo o sheet de campanha

### Detalhes Técnicos
- A edge function reutiliza a mesma lógica de envio do `whatsapp-send` existente (Evolution API / Z-API)
- Clientes sem telefone são excluídos automaticamente
- Rate limiting: delay de 1s entre cada envio para evitar ban do WhatsApp
- RLS: apenas usuários autenticados com acesso à unidade podem criar campanhas

