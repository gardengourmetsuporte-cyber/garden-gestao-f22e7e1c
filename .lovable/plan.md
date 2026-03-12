

## Plano: Conta Business Demo com 3 Meses de Histórico

### Objetivo
Criar uma conta de demonstração completa com plano Business e 3 meses de dados realistas em todos os módulos, executada via script SQL direto no banco.

### Abordagem
Executar um script SQL massivo via `psql` que cria:

1. **Usuário e Perfil**: Criar usuário auth com email `demo@garden.app` / senha `demo1234`, perfil com `plan=business`, role `super_admin`
2. **Unidade**: "Restaurante Garden Demo" com slug único, provisionada com `auto_provision_unit` (já cria categorias financeiras, setores de checklist, contas, etc.)
3. **Funcionários**: 6 funcionários com PINs, cargos variados (gerente, cozinheiro, garçom, caixa, auxiliar, entregador)
4. **Fornecedores**: 8 fornecedores (distribuidora de carnes, bebidas, hortifruti, laticínios, etc.)
5. **Estoque**: 30+ itens com categorias, preços e estoque atual
6. **Movimentações de Estoque**: ~200 entradas e saídas ao longo de 3 meses
7. **Clientes CRM**: 40 clientes com segmentos variados (vip, regular, new, at_risk), pontos de fidelidade, histórico de compras
8. **Transações Financeiras**: ~300 transações (receitas/despesas) distribuídas em 3 meses com categorias reais
9. **Vendas PDV**: ~250 vendas com itens e pagamentos (dinheiro, pix, débito, crédito)
10. **Fechamentos de Caixa**: 1 por dia útil (~60 fechamentos)
11. **Checklist Completions**: Tarefas completadas diariamente por diferentes funcionários (~500 completions)
12. **Pedidos Delivery Hub**: ~80 pedidos de delivery (iFood, Rappi, próprio)
13. **Pedidos de Compra**: ~15 pedidos a fornecedores
14. **Receitas**: 5 receitas com ingredientes vinculados ao estoque
15. **Produtos Menu**: 15 produtos no cardápio digital com categorias
16. **Bônus e Ranking**: Pontos bônus e resgates de recompensas

### Período de Dados
- **Dezembro 2025** a **Março 2026** (3 meses + mês atual parcial)
- Variação realista: dias de semana com mais movimento, finais de semana com picos

### Execução
Script SQL executado via `psql $SUPABASE_DB_URL` em blocos sequenciais. O script usa `DO $$ ... $$` blocks com variáveis para manter referências de IDs entre inserts.

### Credenciais da Conta Demo
- **Email**: `demo@garden.app`
- **Senha**: `demo1234`
- **Plano**: Business (override manual, sem Stripe)

### Riscos e Mitigações
- Triggers de atualização de saldo (finance) serão ativados automaticamente nos inserts — os saldos das contas serão consistentes
- O `auto_provision_unit` já cria toda a estrutura base (categorias, setores, contas) — o script só adiciona dados transacionais em cima

