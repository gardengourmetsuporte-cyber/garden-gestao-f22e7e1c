

## Diagnóstico

O erro é claro nos logs: **`Invalid URL: '/message/sendText/whatsapp-gestao'`**

O canal WhatsApp está cadastrado mas o campo `api_url` está **vazio**. Sem a URL base da Evolution API, o sistema monta uma URL relativa inválida e falha.

## O que precisa ser feito

### 1. Validação antes do envio (edge function)
Adicionar verificação no `whatsapp-bulk-send` para retornar um erro claro quando `api_url` ou `api_key_ref` estiverem vazios, em vez de tentar enviar e falhar silenciosamente.

### 2. Feedback no frontend
Atualizar o `MessageCampaignSheet` para exibir o erro de forma mais clara quando o canal não está configurado, sugerindo ao usuário ir em Configurações do WhatsApp para completar a configuração.

### 3. Configuração do canal
O canal já existe no banco (`provider: evolution`, `instance_name: whatsapp-gestao`, `phone: +5519996152226`) mas falta preencher:
- **`api_url`** — URL base da Evolution API (ex: `https://sua-evolution.com`)
- **`api_key_ref`** — Chave de API da instância

Sem esses dados preenchidos na tela de configurações do WhatsApp, nenhuma mensagem será enviada.

### Resumo das mudanças de código

- **`supabase/functions/whatsapp-bulk-send/index.ts`**: Adicionar validação de `api_url` e `api_key_ref` com mensagem de erro amigável.
- **`src/components/customers/MessageCampaignSheet.tsx`**: Mostrar alerta quando o erro indicar canal não configurado, com link para configurações.

