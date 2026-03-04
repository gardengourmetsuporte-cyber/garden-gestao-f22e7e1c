

# Sistema de Rotas de Entrega com IA (OCR de Fotos)

## Resumo
Sistema onde o operador tira foto de um pedido/comanda (papel, tela, etc.) e a IA extrai automaticamente o endereço, cadastra a entrega e organiza todas as entregas pendentes em rotas agrupadas por proximidade geográfica.

## Fluxo do Usuário
1. Entregador/operador abre a tela de **Rotas de Entrega**
2. Toca em "+" e tira foto ou seleciona imagem do pedido
3. A IA (Lovable AI via Edge Function) lê a foto e extrai: nome do cliente, endereço, bairro, e itens (se visíveis)
4. O sistema cadastra a entrega automaticamente, pedindo apenas confirmação
5. Todas as entregas pendentes aparecem agrupadas por **bairro/região** (proximidade)
6. O entregador vê as rotas organizadas e pode marcar como "saiu" e "entregue"

## Banco de Dados

### Tabela `delivery_addresses`
Cadastro de endereços já reconhecidos pela IA, evitando re-processamento.

```text
delivery_addresses
├── id (uuid, PK)
├── unit_id (uuid, FK units)
├── customer_name (text)
├── full_address (text)
├── neighborhood (text) ← chave de agrupamento
├── city (text)
├── reference (text, nullable) ← ponto de referência
├── lat / lng (numeric, nullable) ← futuro geocoding
├── created_at / updated_at
```

### Tabela `deliveries`
Cada entrega individual.

```text
deliveries
├── id (uuid, PK)
├── unit_id (uuid, FK units)
├── address_id (uuid, FK delivery_addresses)
├── status (enum: pending, out, delivered, cancelled)
├── items_summary (text, nullable) ← resumo extraído pela IA
├── photo_url (text, nullable) ← foto original
├── total (numeric, default 0)
├── notes (text, nullable)
├── assigned_to (uuid, nullable, FK auth.users)
├── delivered_at (timestamptz, nullable)
├── created_by (uuid, FK auth.users)
├── created_at / updated_at
```

### Storage
- Bucket **`delivery-photos`** (privado) para as fotos dos pedidos

## Edge Function `delivery-ocr`
- Recebe `image_base64` da foto do pedido
- Envia para Lovable AI (Gemini Flash) com prompt instruindo para extrair: nome, endereço completo, bairro, itens, valor
- Retorna dados estruturados via tool calling (JSON limpo)
- Padrão já usado no `smart-receiving-ocr` existente

## Página `/deliveries` (nova rota)
**3 seções principais:**

1. **Header** com botão de "Nova Entrega" (abre câmera/galeria)
2. **Entregas agrupadas por bairro** — cards colapsáveis mostrando quantidade e endereços
3. **Status visual** — cores para pending/out/delivered

**Interações:**
- Swipe ou botão para mudar status (pending → out → delivered)
- Ao adicionar foto, mostra preview + dados extraídos pela IA para confirmação antes de salvar
- Filtro por status (Pendentes / Em rota / Entregues)

## Agrupamento por Proximidade
- Fase 1 (agora): Agrupamento por **bairro** (campo `neighborhood` extraído pela IA)
- Fase 2 (futuro): Geocoding real com lat/lng para agrupamento por distância

## Integração com Módulos Existentes
- Adicionado ao `ALL_MODULES` como módulo "Entregas" no grupo "Operação"
- Acessível via menu lateral / barra inferior

## Detalhes Técnicos
- RLS: filtro por `user_has_unit_access` em ambas as tabelas
- A Edge Function reutiliza o padrão do `smart-receiving-ocr` (auth + Lovable AI + tool calling)
- Hook `useDeliveries` com React Query para CRUD + agrupamento client-side por bairro
- Componente de confirmação pós-OCR permite editar antes de salvar

