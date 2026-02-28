

## Plano: Fortalecer Núcleo do CRM — Service Layer, Normalização e Unicidade

### Contexto
Hoje a lógica de clientes está dispersa entre hooks, edge functions e páginas. Telefone não é normalizado consistentemente, e não existe garantia de unicidade. Precisamos centralizar antes de escalar.

### 1. Criar `src/lib/normalizePhone.ts`
Helper puro que:
- Remove todos os caracteres não-numéricos
- Garante prefixo `55` (Brasil)
- Remove nono dígito duplicado se necessário
- Retorna `null` se inválido (menos de 10 dígitos)
- Usado em todos os pontos de entrada: `CustomerSheet`, `import-daily-sales`, `DigitalMenu` roleta

### 2. Criar `src/lib/customerService.ts`
Funções puras e reutilizáveis:

```typescript
normalizePhone(raw: string): string | null
calcularScore(customer): { score, segment, visit_frequency_days }
registrarCompra(customerId, valor, date?): Promise<void>  // via supabase update + trigger cuida do resto
```

- `calcularScore` replica a lógica RFM do banco (`recalculate_customer_score`) no frontend para preview/validação
- `registrarCompra` faz `update` incremental no `total_spent`, `total_orders`, `last_purchase_at` — o trigger `trg_customer_loyalty` já cuida de recalcular score e pontos automaticamente

### 3. Migration: Unique constraint no telefone normalizado
```sql
CREATE UNIQUE INDEX idx_customers_unit_phone 
ON customers (unit_id, phone) 
WHERE phone IS NOT NULL AND phone != '';
```
Isso garante que não existam duplicatas por telefone dentro da mesma unidade.

### 4. Aplicar `normalizePhone` em todos os pontos de entrada
- **`CustomerSheet.tsx`**: Normalizar antes de salvar
- **`import-daily-sales/index.ts`**: Usar mesma lógica de normalização no backend
- **`DigitalMenu.tsx`** (roleta): Já normaliza parcialmente, usar helper consistente
- **`useCustomers.ts`** (`createCustomer`/`updateCustomer`): Normalizar phone antes do insert/update

### 5. Adicionar `registrarCompra` ao hook `useCustomerCRM`
Nova mutation que chama o service, incrementando dados e deixando o trigger do banco fazer o resto (score + pontos).

### Arquivos novos
- `src/lib/normalizePhone.ts`
- `src/lib/customerService.ts`

### Arquivos editados
- `src/components/customers/CustomerSheet.tsx` — normalizar telefone no submit
- `src/hooks/useCustomers.ts` — normalizar phone no create/update
- `src/hooks/useCustomerCRM.ts` — adicionar mutation `registrarCompra`
- `supabase/functions/import-daily-sales/index.ts` — usar normalização consistente
- `src/pages/DigitalMenu.tsx` — usar `normalizePhone` do helper
- Migration SQL para unique index

