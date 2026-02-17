
# Auditoria Completa e Plano de Evolucao - Garden Gestao

---

## 1. AUDITORIA: PONTOS FORTES

### O que funciona bem
- **Arquitetura multi-tenant robusta**: isolamento por `unit_id` com RLS no banco e filtros nos hooks. Solucao madura para redes de franquias.
- **Gamificacao bem estruturada**: sistema duplo de pontos (mensal para ranking, acumulado para progressao) evita injusticas e mantem engajamento de curto e longo prazo.
- **Dashboard diferenciado por perfil**: admin ve financeiro + IA + estoque; funcionario ve pontos + checklists + recompensas. Cada papel ve o que importa.
- **Copiloto com contexto real**: busca 13 fontes de dados em paralelo antes de cada resposta. Nao eh IA generica.
- **Code splitting e lazy loading**: todas as paginas carregam sob demanda, melhorando tempo de abertura.
- **PWA com push notifications**: triggers de banco notificam via edge function, cobrindo estoque zerado e mensagens de chat.
- **Modulos desacoplaveis**: sistema de access levels permite ativar/desativar modulos por perfil, sem alterar codigo.

---

## 2. AUDITORIA: FRAGILIDADES E RISCOS

### Tecnicas
| Problema | Impacto | Onde |
|----------|---------|-----|
| `useManagementAI` executa 13 queries paralelas no Supabase a cada mensagem do copiloto | Latencia alta (~2-4s), consumo de cota de requests, timeout em conexoes lentas | `useManagementAI.ts` |
| Leaderboard carrega TODOS os perfis do sistema (`profiles.select(*)`) sem filtro de unidade | Em redes com muitas unidades, traz usuarios irrelevantes e dados imprecisos | `useLeaderboard.ts` linha 34 |
| Pontos do usuario (`usePoints`) nao filtram por `unit_id` | Um funcionario que trabalha em 2 unidades mistura pontuacoes | `usePoints.ts` |
| Dashboard admin faz 10 queries paralelas no mount sem cache compartilhado com o copiloto | Duplicacao de requests ao abrir a pagina | `useDashboardStats.ts` + `useManagementAI.ts` |
| Historico de conversa do copiloto armazenado apenas em `localStorage` | Perde-se ao trocar de dispositivo ou limpar cache | `useManagementAI.ts` |
| `addSector`, `addItem` nos checklists nao incluem `unit_id` | Registros ficam orfaos (sem unidade), quebrando filtros multi-tenant | `useChecklists.ts` linhas 121, 178 |
| Edge functions com `verify_jwt = false` em todas | Qualquer pessoa pode invocar `management-ai`, `push-notifier`, etc. | `supabase/config.toml` |

### UX/UI
| Problema | Impacto |
|----------|---------|
| FAB (botao flutuante) no canto inferior direito eh o unico ponto de entrada para navegacao | Descoberta de modulos depende de clicar no botao; nao ha breadcrumbs ou barra lateral |
| Copiloto ocupa widget inteiro no dashboard mas comeca colapsado com texto cortado | Primeira impressao eh de "widget morto" |
| Selects e Sheets em mobile exigiam patches manuais (`data-vaul-no-drag`) -- fragil | Cada novo formulario pode regredir |
| Dashboard do funcionario eh estatico: mesmos 3 botoes sempre | Nao se adapta ao turno, ao dia ou ao progresso do usuario |
| Ranking widget no dashboard admin mostra todos os colocados, ocupando metade da tela | Informacao poluida; top 3 ja seria suficiente no dashboard |

### Logica de Negocio
| Problema | Impacto |
|----------|---------|
| Pontos de bônus nao tem limite ou cooldown no banco | Um admin pode dar pontos infinitos sem restricao |
| Fechamento de caixa nao valida soma das formas de pagamento vs total declarado antes de salvar | Inconsistencias financeiras |
| Receitas/fichas tecnicas nao vinculam custo ao preco de venda | Margem de lucro eh invisivel |

---

## 3. EVOLUCAO DE PRODUTO

### 3.1 Modulos Estrategicos Novos

**a) Central de Alertas Inteligentes**
- **Problema**: alertas estao espalhados (notificacoes, copiloto, badge do estoque). Nao ha um lugar unico.
- **Para quem**: admin e gestor.
- **Proposta**: tela `/alerts` que consolida: estoque critico, fechamentos pendentes, despesas vencidas, pedidos atrasados, anomalias financeiras. Prioriza por urgencia. Cada alerta tem acao direta (ex: "Fazer pedido" abre a tela de pedidos pre-preenchida).

**b) Relatorios e Insights**
- **Problema**: admin precisa "perguntar" ao copiloto por analises que deveriam ser visuais.
- **Para quem**: admin.
- **Proposta**: tela `/reports` com DRE simplificado, evolucao de estoque, custo por funcionario, taxa de conclusao de checklists por setor. Graficos interativos com filtro por periodo e unidade.

**c) Modo Turno (Shift Mode)**
- **Problema**: funcionario abre o app e nao sabe por onde comecar.
- **Para quem**: funcionario.
- **Proposta**: ao detectar horario (abertura/fechamento), o dashboard se transforma num fluxo guiado: 1) Checklist do turno, 2) Conferencia de estoque rapida, 3) Fechamento de caixa. Progresso visivel. Ao completar, ganha bonus de "turno perfeito".

**d) Auditoria de Acoes**
- **Problema**: nao ha rastreabilidade de quem fez o que.
- **Para quem**: admin e super_admin.
- **Proposta**: log de acoes criticas (alteracao de estoque, aprovacao de bonus, edicao de transacoes) com timestamp, usuario e diff.

### 3.2 Acoes Inteligentes

- **Auto-provisionamento de pedidos**: quando o estoque de um item atinge 50% do minimo, o sistema cria um rascunho de pedido automaticamente para o fornecedor vinculado.
- **Sugestao de escala baseada em historico**: IA analisa padroes de vendas por dia da semana e sugere quantos funcionarios escalar.
- **Reconciliacao financeira**: ao integrar fechamento de caixa, o sistema cruza formas de pagamento com extrato bancario e sinaliza divergencias.

---

## 4. IA E COPILOTO: UPGRADE

### Estado Atual
O copiloto funciona como chat reativo: o admin pergunta, ele responde. Busca 13 fontes de dados a cada mensagem. Nao sugere nada proativamente e nao executa acoes.

### Evolucao Proposta

**Nivel 1 -- IA como Analista (curto prazo)**
- Criar uma edge function `daily-digest` que roda 1x/dia via cron e gera um resumo automatico (estoque critico, despesas vencidas, ranking do dia anterior).
- Ao abrir o dashboard, mostrar o digest pronto em vez de gerar em tempo real. Reduz latencia de 3s para 0s.
- Cachear o contexto em uma tabela `ai_daily_context` para evitar 13 queries por mensagem.

**Nivel 2 -- IA como Alerta (medio prazo)**
- Copiloto envia notificacoes push proativas: "Voce tem R$2.400 em despesas vencendo amanha" ou "Estoque de carne moida zerou -- devo criar um pedido?".
- Sugestoes contextuais no chat: ao abrir, mostrar 3 chips clicaveis ("Como esta meu caixa?", "Quem mais pontuou?", "Itens para pedir").

**Nivel 3 -- IA como Executor Assistido (longo prazo)**
- Copiloto pode executar acoes com confirmacao: "Criei um pedido de R$850 para o fornecedor X. Confirma o envio?"
- Function calling: a edge function retorna acoes estruturadas (`{ action: 'create_order', data: {...} }`) e o frontend renderiza um botao de confirmacao.
- Historico de conversa migra de localStorage para banco, permitindo continuidade entre dispositivos.

---

## 5. UX/UI: CRITICA DIRETA

### O que precisa mudar

1. **Navegacao**: o FAB eh criativo mas nao intuitivo. Usuarios novos nao entendem que ali estao todos os modulos. Proposta: manter o FAB mas adicionar uma bottom tab bar com 4 atalhos fixos (Dashboard, Checklists, Financeiro, Mais) visivel em todas as telas. O FAB vira atalho contextual (ex: "+" para adicionar transacao na tela de financas).

2. **Sheets/Drawers**: o `min-h-[55vh]` global resolve o problema de altura, mas sheets com poucos campos (ex: editar nome de setor) ficam com muito espaco vazio. Proposta: usar `min-h-[40vh]` como padrao e `min-h-[55vh]` apenas em formularios grandes.

3. **Formularios**: inputs com label + placeholder + icon + help text ao mesmo tempo. Reduzir para label + placeholder. Mover help text para tooltip.

4. **Feedback de acao**: ao completar um checklist, a animacao de moeda eh sutil demais. Proposta: haptic feedback (vibration API) + feedback visual mais prominente (checkmark animado verde).

5. **Dashboard admin**: esta sobrecarregado. O widget de ranking ocupa ~40% da tela. Proposta: mostrar apenas "Voce esta em #X | Lider: [Nome] com Y pts" como barra horizontal. Ranking completo fica na tela `/ranking`.

6. **Copiloto colapsado**: mostrar a primeira frase da saudacao + um CTA "Pergunte algo" em vez de text truncado.

7. **Consistencia de cards**: existem `card-command`, `card-command-info`, `card-command-success`, `card-command-warning`, `finance-hero-card`. Padronizar em 3 variantes maximo.

---

## 6. GAMIFICACAO: AJUSTES

### Problemas Identificados
1. **Bonus sem limite**: admin pode dar 1000 pontos a qualquer momento. Nao ha teto mensal.
2. **Ranking so mede checklists**: ignora outras contribuicoes (fechamento de caixa preciso, pontualidade, etc.).
3. **Recompensas desconectadas**: o catalogo de recompensas nao tem conexao com desempenho financeiro do restaurante.

### Propostas
1. **Teto de bonus**: maximo de 50 pontos de bonus por usuario por mes. Visivel no guia de cooldown.
2. **Multiplicadores de turno**: completar todos os itens de abertura OU fechamento da +20% de bonus nos pontos daquele checklist.
3. **Ranking multidimensional**: alem de pontos de checklist, pontuar:
   - Precisao no fechamento de caixa (diferenca < R$5 = +3 pts)
   - Registro de movimentacoes de estoque (+1 pt por registro)
   - Tempo de resposta no chat da equipe
4. **Recompensa vinculada a meta coletiva**: "Se a equipe toda completar 90% dos checklists no mes, todos ganham 50 pontos bonus." Incentiva cooperacao, nao apenas competicao.
5. **Historico de "Funcionario do Mes"**: galeria com foto e nome dos campeoes mensais anteriores na tela de ranking.

---

## 7. ROADMAP

### Fase 1 -- Consolidacao (1-2 semanas)
**Impacto alto, esforco baixo**
- Corrigir `useChecklists` para incluir `unit_id` em inserts de setor e item
- Corrigir `usePoints` para filtrar por `unit_id`
- Filtrar leaderboard por `user_units` da unidade ativa
- Cachear contexto do copiloto em variavel de estado (evitar 13 queries repetidas)
- Habilitar `verify_jwt = true` em `management-ai` e `push-notifier`
- Reduzir ranking widget no dashboard admin para 1 linha horizontal

### Fase 2 -- Inteligencia (3-4 semanas)
**Impacto alto, esforco medio**
- Implementar `daily-digest` edge function + tabela `ai_daily_context`
- Chips de sugestao no copiloto (3 perguntas contextuais)
- Central de alertas (`/alerts`) com acoes diretas
- Bottom tab bar fixa com 4 atalhos
- Multiplicadores de turno na gamificacao
- Modo Turno para funcionarios

### Fase 3 -- Escala (1-2 meses)
**Impacto transformador, esforco alto**
- Copiloto com function calling (criar pedidos, aprovar bonus via chat)
- Historico de conversa no banco (nao mais localStorage)
- Tela de relatorios/insights com graficos interativos
- Auditoria de acoes criticas
- Ranking multidimensional
- Reconciliacao financeira automatizada
- Metas coletivas na gamificacao

---

## Secao Tecnica: Detalhes de Implementacao

### Correcoes Criticas (Fase 1)

**1. unit_id em Checklists**
Arquivos: `src/hooks/useChecklists.ts`
- `addSector`: adicionar `unit_id: activeUnitId` no payload de insert
- `addSubcategory`: adicionar `unit_id: activeUnitId`
- `addItem`: adicionar `unit_id: activeUnitId`

**2. unit_id em Pontos**
Arquivo: `src/hooks/usePoints.ts`
- Adicionar `activeUnitId` como parametro
- Filtrar `checklist_completions` e `bonus_points` por `unit_id`

**3. Leaderboard filtrado**
Arquivo: `src/hooks/useLeaderboard.ts`
- Substituir `profiles.select(*)` por join com `user_units` filtrando pela unidade ativa
- Isso garante que so aparecem funcionarios da unidade no ranking

**4. Cache do contexto AI**
Arquivo: `src/hooks/useManagementAI.ts`
- Armazenar resultado de `fetchFullContext()` em `useRef` com TTL de 5 minutos
- Reutilizar cache entre mensagens consecutivas

**5. JWT em Edge Functions**
Arquivo: `supabase/config.toml`
- Alterar `verify_jwt = false` para `true` em `management-ai` e `push-notifier`
- Manter `false` apenas em `whatsapp-webhook` (webhook externo) e `tablet-order` (acesso publico)

### Novas Estruturas (Fase 2)

**Tabela `ai_daily_context`**
```sql
CREATE TABLE ai_daily_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  context_data jsonb NOT NULL DEFAULT '{}',
  digest_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, date)
);
```

**Edge Function `daily-digest`**
- Cron trigger via pg_cron ou Supabase scheduled function
- Executa as 13 queries uma vez, salva em `ai_daily_context`
- Copiloto le do cache em vez de executar queries diretas
