

# Minha Conta → Scanner de Comanda → Conta Específica

## Problema
Atualmente, "Minha Conta" abre diretamente o painel com TODOS os pedidos da mesa. Mas uma mesa pode ter múltiplas comandas, então o cliente precisa escanear/digitar o número da comanda para ver apenas os pedidos dela.

## Solução

### 1. Fluxo novo
- Clicar em "Minha Conta" → abre o `ComandaScanner` (câmera + opção manual)
- Após escanear/digitar o número da comanda → abre o `BillPanel` filtrando por `comanda_number` em vez de apenas `table_number`

### 2. `TabletHome.tsx`
- Adicionar state `billComanda: number | null` para armazenar a comanda selecionada
- Ao clicar em "Minha Conta" (3 pontos: mobile, desktop, e menu grid), em vez de `setActivePanel('bill')`, abrir o scanner
- Adicionar state `showBillScanner: boolean`
- No `onScan` do scanner: setar `billComanda`, fechar scanner, abrir painel bill
- Importar `ComandaScanner`

### 3. `BillPanel` — filtrar por comanda
- Receber prop `comandaNumber: number | null`
- Na query, quando `comandaNumber` está definido, adicionar `.eq('comanda_number', comandaNumber)` ao filtro
- Exibir "Comanda X" no subtítulo em vez de apenas "Mesa Y"

### Arquivos a editar
1. **`src/pages/TabletHome.tsx`** — states, scanner, filtro no BillPanel

