

# Renomear Abas e Expandir Medalhas

## Resumo
Consolidacao dos dois planos aprovados anteriormente:
1. Renomear abas no Ranking Hub: "Objetivos" vira **"Elos"**, "Bonus" vira **"Medalhas"**
2. Remover medalha "Dia Perfeito" e expandir para 4 medalhas especiais com bonus de pontos

## Mudancas nas Abas (Ranking.tsx)

| Antes | Depois | Icone |
|-------|--------|-------|
| Ranking | Ranking (sem mudanca) | Trophy |
| Objetivos | Elos | Shield |
| Bonus | Medalhas | Medal |

A aba "Medalhas" vai exibir o componente `MedalList` com as medalhas do usuario, mais o botao admin de dar bonus.

## Novas Medalhas (4 total)

| Medalha | Descricao | Tier | Bonus |
|---------|-----------|------|-------|
| Funcionario do Mes | Reconhecido pelo gestor | Platinum | +50 pts |
| 6 Meses de Casa | Completou 6 meses na empresa | Gold | +30 pts |
| 1 Ano de Casa | Completou 1 ano na empresa | Platinum | +75 pts |
| Inventor | Criou uma receita oficial para o Garden | Gold | +40 pts |

## Detalhes Tecnicos

### `src/lib/medals.ts`
- Adicionar tier `silver` ao `MedalTier`
- Remover `hasPerfectDay` do `MedalData`
- Adicionar `admissionDate?: string` e `hasInventedRecipe?: boolean` ao `MedalData`
- Adicionar campo `bonusPoints: number` na interface `Medal`
- Expandir `calculateMedals()` para retornar 4 medalhas com logica de admissao e badges
- Adicionar config de cor para tier `silver` no `TIER_CONFIG`

### `src/pages/Ranking.tsx`
- Mudar `TabKey` para `'ranking' | 'elos' | 'medalhas'`
- Renomear labels e icones das abas
- Aba "elos" exibe `EloList` diretamente
- Aba "medalhas" exibe `MedalList` + botao admin de bonus
- Importar `useProfile` para obter medalhas do usuario
- Atualizar subtitulo do header

### `src/hooks/useProfile.ts`
- Remover logica de `hasPerfectDay` (agrupamento por dia)
- Buscar `admission_date` da tabela `employees` para o usuario
- Buscar `badge_id = 'inventor'` nos `bonus_points`
- Passar `admissionDate` e `hasInventedRecipe` para `calculateMedals()`

### `src/hooks/useTeamAchievements.ts`
- Remover calculo de `hasPerfectDay` por usuario
- Buscar `admission_date` dos employees
- Verificar badges `inventor` para cada membro
- Passar dados corretos para `calculateMedals()`

### `src/components/profile/MedalList.tsx`
- Mostrar o bonus de pontos de cada medalha no visual ("+50 pts" abaixo do titulo)

### `src/components/ranking/ObjectivesList.tsx`
- Nao precisa mudar (ja aponta para EloList, sera usado pela aba "elos")

