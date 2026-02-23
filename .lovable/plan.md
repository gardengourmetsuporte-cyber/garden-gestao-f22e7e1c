
# Ranking com Reset Mensal + Ranking Global vs Casa

## Resumo

O sistema de ranking passa a ter dois modos de visualizacao e uma separacao clara entre **pontos de competicao** (mensais, resetam todo mes) e **pontos acumulados** (persistem para gastar na loja de recompensas).

---

## Como vai funcionar

### Separacao de conceitos

| Conceito | Descricao | Reseta? |
|----------|-----------|---------|
| **Score mensal** | Pontos de tarefas + bonus do mes atual. Usado para definir o ranking e o Funcionario do Mes. | Sim, todo mes |
| **Pontos acumulados** | Total historico de pontos ganhos menos pontos gastos. Usado para trocar por recompensas na loja. | Nao |

Isso ja funciona assim no sistema atual -- o `get_leaderboard_data` RPC ja filtra por mes. A mudanca principal e visual e de nomenclatura.

### Duas abas de Ranking

1. **Ranking da Casa** (padrao) -- mostra apenas funcionarios da unidade ativa (`activeUnitId`). E o comportamento atual.
2. **Ranking Global** -- mostra funcionarios de TODAS as unidades do sistema, competindo entre si. Permite ver quem e o melhor entre todas as lojas.

### Funcionario do Mes

O primeiro colocado no "Ranking da Casa" ao final do mes e o candidato ao titulo. O gestor pode conceder a medalha via `BonusPointSheet` com `badge_id: 'employee_of_month'`. Os pontos da premiacao se somam ao acumulado permanente.

---

## Plano de implementacao

### 1. Criar funcao RPC `get_global_leaderboard_data`

Uma nova funcao SQL que faz o mesmo que `get_leaderboard_data` mas sem filtrar por `unit_id`. Busca dados de completions, bonus e spent de TODAS as unidades.

Parametros: `p_month_start date, p_month_end date` (sem `p_unit_id`).

Retorna os mesmos campos: `user_id, earned_points, bonus_points, spent_points, earned_all_time`.

### 2. Atualizar `useLeaderboard` com modo global

Adicionar um parametro `scope: 'unit' | 'global'` ao hook. Quando `scope = 'global'`:
- Chama `get_global_leaderboard_data` em vez de `get_leaderboard_data`
- Busca perfis de todos os user_ids retornados (sem filtrar por `user_units` de uma unidade especifica)
- Adiciona campo `unit_name` ao `LeaderboardEntry` para identificar de qual unidade o funcionario e

**Arquivo:** `src/hooks/useLeaderboard.ts`

### 3. Atualizar `Leaderboard` para mostrar unidade no modo global

No modo global, cada entrada do ranking mostra um badge com o nome da unidade abaixo do nome do funcionario.

**Arquivo:** `src/components/dashboard/Leaderboard.tsx`

### 4. Atualizar `Ranking.tsx` com sub-abas no ranking

Dentro da aba "Ranking", adicionar dois botoes de filtro: "Minha Casa" e "Global". Ao trocar, o leaderboard busca os dados do escopo correspondente.

**Arquivo:** `src/pages/Ranking.tsx`

### 5. Atualizar `MyRankCard` com labels claros

Mostrar separadamente:
- **Score do mes**: pontos de competicao (reseta)
- **Saldo acumulado**: pontos disponiveis para gastar

**Arquivo:** `src/components/ranking/MyRankCard.tsx`

---

## Detalhes tecnicos

### Nova RPC: `get_global_leaderboard_data`

```text
Parametros: p_month_start date, p_month_end date
Retorno: user_id uuid, earned_points bigint, bonus_points bigint, spent_points bigint, earned_all_time bigint, unit_id uuid

Logica:
- monthly_earned: SUM de checklist_completions WHERE date BETWEEN p_month_start AND p_month_end (sem filtro de unit_id)
- all_time_earned: SUM de todas completions do usuario
- bonus: SUM de bonus_points WHERE month = p_month_start
- spent: SUM de reward_redemptions com status approved/delivered
- Retorna tambem o unit_id principal do usuario (da tabela user_units WHERE is_default = true)
```

### Fetch global no hook

O fetch global precisa:
1. Chamar a RPC sem unit_id
2. Buscar perfis de TODOS os user_ids retornados
3. Buscar nomes das unidades para exibir badges
4. Cache separado: queryKey `['leaderboard-global', month]`

### Nao precisa mudar no banco

- A tabela `bonus_points` ja armazena `badge_id = 'employee_of_month'` corretamente
- O campo `month` ja isola os bonus por mes
- A RPC existente ja calcula `earned_all_time` separado do mensal
- O sistema de `reward_redemptions` ja desconta do saldo historico

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar -- RPC `get_global_leaderboard_data` |
| `src/hooks/useLeaderboard.ts` | Editar -- adicionar scope global, fetch de unidades, novo tipo com unit_name |
| `src/components/dashboard/Leaderboard.tsx` | Editar -- mostrar badge de unidade no modo global |
| `src/pages/Ranking.tsx` | Editar -- adicionar sub-abas "Minha Casa" / "Global" |
| `src/components/ranking/MyRankCard.tsx` | Editar -- mostrar score mensal vs saldo acumulado separados |

---

## Resultado esperado

- Ranking mensal reseta automaticamente (ja funcionava, agora fica explicito na UI)
- Funcionarios veem claramente "score do mes" vs "saldo para gastar"
- Aba "Global" permite competicao entre unidades com badge da casa de cada funcionario
- Aba "Minha Casa" mantem o ranking interno da unidade (comportamento atual)
- Funcionario do Mes continua sendo concedido pelo gestor via bonus com medalha
