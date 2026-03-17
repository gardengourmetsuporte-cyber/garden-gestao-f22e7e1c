## Sistema de Comandas Físicas com QR Code ✅

### Implementado

Sistema de comandas físicas numeradas (1-100) com QR code para vincular pedidos e facilitar cobrança agrupada.

### Fluxo
1. Admin gera e imprime QR codes das comandas (Configurações → Comandas Físicas)
2. Cliente faz pedido no tablet → ao finalizar, escaneia a comanda física com a câmera
3. Pedido é vinculado ao `comanda_number` automaticamente
4. Na cobrança, todos os pedidos da mesma comanda são agrupados

---

## Bloco de Relatórios Avançados ✅

- CMV Report (Custo de Mercadoria Vendida) — cruza vendas × fichas técnicas
- Estoque Valorizado — valor total em estoque por categoria
- Curva ABC — classificação Pareto de produtos por receita
- Relatório de Funcionários — custos de folha por mês
- Página `/reports` com abas (Vendas | CMV | Estoque | ABC | Funcionários)

## Dashboard Analytics ✅

- Heatmap de vendas (hora × dia da semana)
- Comparativo mês a mês (variação %)
- Break-even calculator
- Multi-unit overview (visão consolidada de todas unidades)

## Operacional ✅

- Contagem de estoque periódica (inventário físico)
- Reservas de mesas com status management
- Fila de espera digital
- Mapa visual de mesas (salão com status)
- Cupons de desconto para cardápio digital
- Transferência de estoque entre unidades

## CRM / Clientes ✅

- Histórico de pedidos do cliente (POS + tablet)
- Alertas de aniversário
- LGPD: exportar/anonimizar dados do cliente
- Cashback & regras de fidelidade (pontos por real, visitas, aniversário, cashback %)

## Funcionários ✅

- Upload e gestão de documentos (RG, CPF, ASO, contratos, etc)
- Controle de validade com alertas de vencimento
- Banco de horas (controle de horas extras)
- Gestão de férias e ausências
- Holerite digital (geração PDF)

## Cardápio Digital ✅

- Order tracker em tempo real (status do pedido via realtime)
- Multi-idioma (PT-BR, EN, ES) com seletor de idioma
- Favoritos de cliente no cardápio

## Sistema / UX ✅

- Tour guiado interativo para novos usuários
- Log de auditoria avançado com filtros de data e exportação CSV

## Multi-Unit ✅

- Ranking de unidades por performance
- Replicação de cardápio entre unidades
- Transferência de estoque entre unidades

## NPS / Avaliações ✅

- Widget de NPS pós-compra (0-10)
- Dashboard de NPS (promotores, neutros, detratores)

## Estoque Avançado ✅

- Controle de lotes e validade (FIFO)
- Alertas de vencimento (7 dias)

## Produção Integrada ao Checklist ✅

- Itens de checklist vinculados a itens de estoque (categoria Produção)
- Ao completar tarefa de produção, abre sheet para informar quantidade produzida
- Entrada automática no estoque + registro de produção
- Badge visual de produção nos itens vinculados
- Configuração de vínculo no admin de checklists
- Removido módulo Produção da página de Pedidos
