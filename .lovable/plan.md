
# Sistema de Pontuacao Justa - Funcionario do Mes

## Problema Atual

O ranking ordena por `earned_points` (soma total de `points_awarded` de checklists). Quem trabalha mais dias ou executa mais tarefas domina automaticamente. Nao existe bonus por qualidade, disciplina ou reconhecimento do gestor.

## Solucao

Criar um sistema de **pontos bonus** com pesos altos que funcionam como "viradas de jogo", permitindo que qualquer funcionario dispute o ranking mensal. O ranking passa a filtrar por mes e somar pontos base + bonus.

---

## 1. Nova Tabela: `bonus_points`

Armazena pontos bonus concedidos automaticamente (conquistas) ou manualmente (gestor).

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| user_id | uuid | Funcionario que recebeu |
| unit_id | uuid | Unidade |
| points | integer | Quantidade de pontos bonus |
| reason | text | Descricao (ex: "Semana Perfeita") |
| type | text | `auto` ou `manual` |
| badge_id | text | ID da conquista (nullable, para auto) |
| awarded_by | uuid | Quem concedeu (nullable, para manual) |
| month | date | Primeiro dia do mes de referencia |
| created_at | timestamptz | Quando foi concedido |

RLS: Admins gerenciam tudo, usuarios veem os proprios.

---

## 2. Conquistas de Alto Valor (automaticas)

Calculadas no frontend a partir de dados existentes, quando desbloqueadas geram um registro em `bonus_points` automaticamente.

| Conquista | Condicao | Pontos Bonus | Frequencia |
|-----------|----------|--------------|------------|
| Pontualidade Perfeita | 5 dias consecutivos com tarefas antes das 9h | 15 pts | 1x por semana |
| Semana Perfeita | Completou 100% dos checklists em todos os dias da semana | 25 pts | 1x por semana |
| Sequencia de Fogo | 7 dias seguidos completando tarefas | 20 pts | 1x por mes |
| Velocista | 5+ tarefas concluidas em 1 hora | 10 pts | 1x por semana |
| Madrugador | Tarefa antes das 7h | 5 pts | 1x por semana |

Anti-spam: cada conquista tem cooldown (semanal ou mensal) controlado pela coluna `badge_id` + `month`.

---

## 3. Bonus Manual do Gestor ("Atitude Destaque")

O admin podera conceder bonus diretamente a qualquer funcionario com:
- Motivo descritivo (ex: "Resolveu problema do cliente sem ser solicitado")
- Quantidade de pontos (sugestao: 10, 15, 20, 25)

Acessivel via um botao na aba de Performance do modulo de Funcionarios.

---

## 4. Ranking Mensal

O leaderboard passa a exibir dados **filtrados por mes**:
- **Pontos Base**: soma de `checklist_completions.points_awarded` do mes
- **Pontos Bonus**: soma de `bonus_points.points` do mes
- **Score Total**: Base + Bonus (ordenacao principal)

Adicionar seletor de mes no componente Leaderboard.

---

## 5. Funcionario do Mes

Destacar visualmente o 1o colocado do ranking mensal com:
- Badge especial no perfil
- Icone de trofeu no leaderboard
- Label "Funcionario do Mes" no dashboard

---

## Detalhes Tecnicos

### Banco de Dados (migracao SQL)
- Criar tabela `bonus_points` com RLS
- Politicas: admin ALL, usuario SELECT proprio

### Arquivos a criar:
- `src/hooks/useBonusPoints.ts` -- CRUD de bonus, calculo de conquistas automaticas, concessao manual
- `src/components/employees/BonusPointSheet.tsx` -- Sheet para admin conceder bonus manual

### Arquivos a editar:
- `src/hooks/useLeaderboard.ts` -- adicionar filtro por mes, somar bonus_points, novo campo `bonus_points` e `total_score` no LeaderboardEntry
- `src/components/dashboard/Leaderboard.tsx` -- seletor de mes, exibir score total (base + bonus), badge "Func. do Mes"
- `src/lib/achievements.ts` -- adicionar funcao para verificar conquistas de alto valor com cooldown
- `src/components/employees/EmployeePerformance.tsx` -- botao "Dar Bonus" por funcionario
- `src/hooks/useProfile.ts` -- incluir bonus_points no perfil
- `src/pages/Profile.tsx` -- exibir bonus recebidos

### Fluxo de conquista automatica:
1. Hook `useBonusPoints` verifica se o usuario desbloqueou alguma conquista de alto valor no mes atual
2. Checa se ja existe registro em `bonus_points` com mesmo `badge_id` + `month` (cooldown)
3. Se nao existe, insere automaticamente e mostra notificacao/animacao

### Sem alteracao na logica base de pontos:
Os pontos de checklists continuam funcionando exatamente como antes. O bonus e uma camada adicional que soma ao ranking mensal.
