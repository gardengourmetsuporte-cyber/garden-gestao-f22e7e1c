

## Diagnóstico

O canal WhatsApp da sua unidade está com `api_url` e `api_key_ref` vazios no banco. Quando a edge function detecta isso, retorna HTTP 400 com a mensagem `CANAL_SEM_CONFIG`. Porém, o `supabase.functions.invoke` trata qualquer resposta não-2xx como erro, então o código cai no `if (error) throw error` **antes** de conseguir ler `data.error` e mostrar o alerta de configuração.

## Solução

Duas correções:

**1. Edge function (`whatsapp-bulk-send/index.ts`)**: Retornar HTTP 200 (em vez de 400/404) para erros de configuração do canal, com `{ error: "CANAL_SEM_CONFIG:..." }` no body. Assim o frontend consegue ler `data.error` normalmente.

- Canal não encontrado → `200 { error: "Nenhum canal..." }`
- Canal sem `api_url` → `200 { error: "CANAL_SEM_CONFIG:..." }`
- Canal sem `api_key_ref` → `200 { error: "CANAL_SEM_CONFIG:..." }`

**2. Frontend (`MessageCampaignSheet.tsx`)**: Adicionar fallback no `catch` para também detectar `CANAL_SEM_CONFIG` na mensagem de erro, caso a edge function retorne non-2xx por outro motivo.

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/whatsapp-bulk-send/index.ts` | Mudar status 400/404 para 200 nos erros de config do canal |
| `src/components/customers/MessageCampaignSheet.tsx` | Detectar `CANAL_SEM_CONFIG` também no `catch` |

