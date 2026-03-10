

# Plano: Scanner iFood no FAB do PDV

## Resumo
Substituir a ação "Pedidos" no speed dial do FAB por um **Scanner iFood** que tira foto da tela do iFood (celular/tablet), usa IA para extrair os dados do pedido e importa automaticamente como um pedido no `delivery_hub_orders`.

## Alterações

### 1. Nova Edge Function: `ifood-order-scanner`
- Recebe imagem base64 da foto do pedido iFood
- Usa Lovable AI (gemini-2.5-flash) para extrair:
  - Nome do cliente, telefone, endereço
  - Itens (nome, quantidade, preço unitário, observações)
  - Subtotal, taxa de entrega, desconto, total
  - Forma de pagamento, número do pedido iFood
- Retorna JSON estruturado com os dados extraídos

### 2. Hook: `useIfoodScanner`
- Gerencia o fluxo: captura foto → envia para edge function → exibe resultado → confirma importação
- Na confirmação, insere em `delivery_hub_orders` (platform = 'ifood', status = 'new') e `delivery_hub_order_items`
- Reutiliza padrão do `useSmartScanner` (state machine com preview/resultado/execução)

### 3. UI: `IfoodScannerSheet`
- Bottom sheet com 3 estados:
  - **Scanning**: preview da foto + loading
  - **Review**: dados extraídos editáveis (cliente, itens, total) para confirmar
  - **Done**: confirmação de importação
- Botões para câmera e galeria

### 4. Atualizar FAB do PDV (`PDV.tsx`)
- Trocar a ação "Pedidos" por "Scanner iFood" com ícone `Camera`
- Ao clicar, abre input de arquivo (câmera/galeria) → dispara o scanner → abre o sheet de revisão
- Manter "Vendas" e "Fechar Caixa" como estão

### Fluxo
```text
FAB tap "Scanner iFood"
  → Abre câmera/galeria
  → Foto enviada à edge function
  → IA extrai dados do pedido
  → Sheet de revisão (editar se necessário)
  → Confirmar → insere em delivery_hub_orders + items
  → Pedido aparece na aba iFood/Rappi do painel de pedidos
```

### Detalhes técnicos
- Edge function usa `LOVABLE_API_KEY` (já configurado) com modelo `google/gemini-2.5-flash`
- Prompt estruturado para extrair dados de screenshot do app iFood
- Inserção no banco usa `supabaseAdmin` (service role) dentro da edge function para evitar RLS
- Matching de itens do pedido com produtos do cardápio (`tablet_products`) quando possível

