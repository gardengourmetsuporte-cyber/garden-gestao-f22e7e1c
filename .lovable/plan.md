

# Estudo Completo: Roadmap para App Unicornio de Gestao

## O que ja existe (16 modulos ativos)

O sistema ja possui uma base muito solida:

| Modulo | Status | Observacao |
|---|---|---|
| Dashboard (Admin + Funcionario) | Completo | Widgets, ranking, agenda |
| Financeiro | Avancado | Contas, categorias, graficos, cartao de credito, tags |
| Estoque | Avancado | CRUD, movimentacoes, min stock, recebimento OCR com IA |
| Pedidos a Fornecedores | Completo | Draft, envio, recebimento, vinculo com estoque |
| Checklists Operacionais | Completo | Setores, subcategorias, pontuacao, frequencia |
| Fechamento de Caixa | Avancado | Meios de pagamento, integracao financeira, validacao |
| Fichas Tecnicas (Receitas) | Completo | Ingredientes vinculados ao estoque, custo |
| Funcionarios + Holerites | Completo | Pagamentos, integra financeiro, CPF |
| Escala de Trabalho | Basico | Solicitacao e aprovacao de folga |
| Recompensas + Gamificacao | Completo | Pontos, ranking, resgate, loja interna |
| Chat Interno | Completo | Direto, grupo, anuncios, pinned |
| Marketing | Basico | Feed de posts, calendario, rascunhos |
| Cardapio Digital | Avancado | Categorias, produtos, opcoes, grupos, vinculos |
| Tablet (Pedido publico) | Avancado | QR Code, integracao Colibri |
| WhatsApp Bot | Estruturado | Canais, conversas, IA, knowledge base, pedidos |
| Notificacoes Push | Completo | VAPID, service worker, alertas por horario |

---

## Lacunas Identificadas - O que Falta para ser Unicornio

### BLOCO 1 - Inteligencia Artificial Acionavel (Maior Diferencial)

**1.1 Assistente IA no Dashboard ("Copiloto de Gestao")**

Hoje o `management-ai` existe como edge function mas nao aparece em lugar algum da interface. Implementar um widget de chat com IA no Dashboard que:
- Resume o dia automaticamente ("Voce tem 3 contas vencendo, estoque critico de bacon, checklist de abertura incompleto")
- Responde perguntas em linguagem natural ("Quanto gastei com fornecedores este mes?")
- Sugere acoes proativas ("Bacon zerado ha 2 dias. Criar pedido para Distribuidora X?")

Tecnologia: Edge function `management-ai` ja existente + modelo Lovable AI (gemini-2.5-flash) -- nao precisa de API key externa.

**1.2 Previsao de Reposicao de Estoque (IA Preditiva)**

Analisar historico de `stock_movements` para prever quando cada item vai zerar e sugerir pedidos automaticos. Exibir como alerta no dashboard: "Bacon deve acabar em ~3 dias baseado no consumo medio".

Tecnologia: Calculo no frontend usando media movel simples dos ultimos 30 dias de saida.

**1.3 Sugestao Inteligente de Categorias Financeiras**

Ao digitar a descricao de uma transacao, a IA sugere automaticamente a categoria com base no historico. Exemplo: digitou "Coca-cola" -> sugere categoria "Bebidas > Refrigerantes".

Tecnologia: Lookup local no historico de transacoes do usuario (sem custo de IA).

---

### BLOCO 2 - Planejamento Financeiro (Modulo ja criado porem vazio)

**2.1 Orcamentos por Categoria**

A tabela `finance_budgets` ja existe no banco com `category_id`, `planned_amount`, `month`, `year`. O componente `FinancePlanning` exibe apenas "Em breve". Implementar:
- Definir orcamento mensal por categoria (ex: "Carnes: R$5.000/mes")
- Barra de progresso mostrando % gasto vs planejado
- Alerta quando atingir 80% e 100% do orcamento
- Comparativo mes a mes (gastou mais ou menos que o planejado)

**2.2 Fluxo de Caixa Projetado**

Calcular entradas e saidas futuras (parcelas, recorrentes, contas a pagar) e projetar o saldo futuro em grafico de linha com horizonte de 30/60/90 dias.

---

### BLOCO 3 - Relatorios e Insights

**3.1 DRE Simplificado (Demonstrativo de Resultados)**

Micro e pequenas empresas precisam de um DRE basico:
- Receita Bruta (vendas)
- (-) Custos Diretos (CMV: custo de mercadoria via fichas tecnicas)
- = Lucro Bruto
- (-) Despesas Operacionais (salarios, aluguel, etc)
- = Resultado Liquido

Dados ja existem entre `finance_transactions`, `recipes` e `employee_payments`.

**3.2 Relatorio de Performance por Funcionario**

Cruzar dados de checklists concluidos, pontos, resgates e fechamentos de caixa para gerar um "score" de performance por colaborador. Util para avaliacoes e feedbacks.

---

### BLOCO 4 - Automacoes que Economizam Tempo

**4.1 Transacoes Financeiras Recorrentes Automaticas**

O campo `is_recurring` e `recurring_interval` ja existem em `finance_transactions`, mas nao ha automacao que gere as transacoes futuras automaticamente. Criar uma logica que, ao abrir o mes, gere os lancamentos recorrentes pendentes (aluguel, internet, salarios).

**4.2 Pedido Automatico ao Fornecedor**

Quando um item de estoque atinge o `min_stock`, gerar automaticamente um rascunho de pedido ao fornecedor padrao do item. O gestor so precisa revisar e enviar.

**4.3 Checklist Clone para Nova Unidade**

Ao criar uma nova unidade, oferecer opcao de clonar toda a estrutura de checklists (setores, subcategorias, itens) de uma unidade existente.

---

### BLOCO 5 - Experiencia Mobile Disruptiva

**5.1 Onboarding Guiado (Wizard de Primeiro Uso)**

Hoje o usuario cai no app sem contexto. Criar um wizard de 4-5 telas que:
- Cadastra a primeira unidade (ja existe)
- Importa categorias padrao de estoque
- Configura meios de pagamento do fechamento de caixa
- Cria o primeiro checklist com templates pre-definidos (hamburgueria, pizzaria, cafeteria)

**5.2 Atalhos Rapidos com Gestos**

- Swipe em item de estoque para entrada/saida rapida
- Long-press em transacao financeira para duplicar
- Shake-to-refresh no dashboard

**5.3 Modo Offline Robusto**

O PWA ja funciona offline para cache, mas nao ha fila de operacoes offline. Implementar queue de mutacoes que sincroniza quando reconectar.

---

### BLOCO 6 - Integracao e Comunicacao

**6.1 Exportacao de Relatorios (PDF/Excel)**

Gerar PDF do DRE, do fechamento de caixa e da lista de estoque para compartilhar com contadores ou socios. Usar biblioteca de geracao de PDF no frontend.

**6.2 Compartilhar Pedido via WhatsApp**

Ao marcar um pedido como "enviado", gerar texto formatado e abrir link `wa.me` para enviar direto ao fornecedor. O telefone do fornecedor ja esta cadastrado.

---

## Priorizacao Recomendada

Considerando impacto vs esforco para micro/pequenas empresas:

```text
FASE 1 - Quick Wins (1-2 semanas)
+--------------------------------------------------+
| 1. Copiloto IA no Dashboard (1.1)                |
| 2. Orcamentos por Categoria (2.1)                |
| 3. Transacoes Recorrentes Automaticas (4.1)      |
| 4. Compartilhar Pedido via WhatsApp (6.2)        |
+--------------------------------------------------+

FASE 2 - Diferenciacao (2-4 semanas)
+--------------------------------------------------+
| 5. Previsao de Reposicao de Estoque (1.2)        |
| 6. DRE Simplificado (3.1)                        |
| 7. Fluxo de Caixa Projetado (2.2)               |
| 8. Pedido Automatico ao Fornecedor (4.2)         |
+--------------------------------------------------+

FASE 3 - Polimento (4-6 semanas)
+--------------------------------------------------+
| 9. Relatorio de Performance (3.2)                |
| 10. Sugestao Inteligente de Categorias (1.3)     |
| 11. Onboarding Guiado (5.1)                     |
| 12. Exportacao PDF (6.1)                         |
| 13. Checklist Clone entre Unidades (4.3)         |
+--------------------------------------------------+
```

## Detalhes Tecnicos

**Nenhuma dependencia externa necessaria** - Todas as features utilizam:
- Lovable AI (gemini-2.5-flash) para funcoes de IA -- sem API key
- Tabelas que ja existem no banco (`finance_budgets`, `recurring_interval`, etc)
- Dados que ja estao sendo coletados (movimentacoes, transacoes, completions)
- Bibliotecas ja instaladas (recharts para graficos, date-fns para datas)

**Arquivos novos estimados**: ~8-12 componentes novos + 3-4 hooks
**Arquivos editados**: ~6-8 hooks e componentes existentes
**Migrations**: 1-2 (tabela de fila offline, campo de previsao)

---

## Resumo

O app ja tem 80% da infraestrutura de um unicornio. O que falta e a **camada de inteligencia** (IA acionavel, previsoes, automacoes) e a **camada de planejamento** (orcamentos, DRE, fluxo de caixa). Esses 13 itens transformam o app de "ferramenta de registro" em "copiloto de gestao" -- o verdadeiro diferencial para micro e pequenas empresas que hoje dependem de planilhas ou sistemas caros e complexos.

