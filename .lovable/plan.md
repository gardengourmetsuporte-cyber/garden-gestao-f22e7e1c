## Plano: Cashback 10% — 1 ponto a cada R$10 gastos ✅

### Implementado

A regra de acúmulo de Garden Coins foi atualizada de **1:1** (R$1 = 1 moeda) para **1 ponto a cada R$10 gastos** (cashback de 10%).

- Pedido de R$100 → 10 pontos
- Pedido de R$45 → 4 pontos  
- Pedido de R$8 → 0 pontos (abaixo de R$10)

### Arquivos alterados
- Migration SQL: `auto_register_customer_on_order` e `auto_register_customer_on_order_insert` — `floor(NEW.total)` → `floor(NEW.total / 10)`

### O que NÃO mudou
- `coin_price` dos produtos (preço em pontos = preço em reais)
- Checkout com moedas no cardápio digital
- Pontos já acumulados (não retroativo)
