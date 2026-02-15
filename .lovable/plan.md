

# Reorganizacao do Sistema de Pontuacao - Mensal vs Acumulado

## Situacao Atual

O ranking mensal ja funciona corretamente nos bastidores: o `useLeaderboard` filtra completions e bonus por mes. O problema principal e que a **interface nao diferencia claramente** Score Mensal de Pontos Acumulados, e alguns componentes misturam os dois.

## O que muda

### 1. Hook `usePoints` - Adicionar Score Mensal

Atualmente o hook busca apenas pontos totais (historico). Sera adicionada uma query paralela que filtra completions e bonus do mes atual para calcular o **Score Mensal** separadamente.

- `monthlyScore`: pontos de checklists + bonus do mes atual
- `earned` (historico): continua existindo para conquistas, medalhas e ranks

### 2. Dashboard do Funcionario (`EmployeeDashboard`)

- O card de pontos passara a mostrar **Score Mensal** em destaque (grande) e Pontos Acumulados em separado (menor)
- A barra de progresso do rank continua usando pontos acumulados (historico)
- Adicionar aviso visivel: "O ranking e mensal e reinicia todo mes. Apenas o score mensal conta."

### 3. `UserPointsCard` - Reformular

- Area principal: **Score Mensal** (destaque visual)
- Linha inferior: Base Mensal | Bonus Mensal | Acumulado Total
- Remover ambiguidade entre score mensal e pontos historicos

### 4. Leaderboard - Manter como esta

O Leaderboard ja e 100% mensal. Sem alteracoes necessarias na logica.

### 5. Pagina de Perfil (`Profile`)

- Separar visualmente: "Score do Mes" (card em destaque) e "Historico Total" (card secundario)
- Manter conquistas e medalhas baseadas em pontos acumulados (historico)
- Manter rank/moldura baseados em pontos acumulados

### 6. Ranks e Conquistas

- `getRank()` continua usando pontos acumulados (historico) - os ranks sao progressao de longo prazo
- `calculateAchievements()` continua usando pontos acumulados - sao metas progressivas
- Nenhuma alteracao necessaria nestes modulos

### 7. Recompensas (Saldo para resgate)

- O saldo para resgatar premios continua sendo: pontos acumulados ganhos - pontos gastos
- Score mensal NAO afeta saldo de resgate (sao conceitos separados)

## Detalhes Tecnicos

### Alteracoes em `usePoints.ts`

```typescript
// Adicionar query mensal paralela
const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

// Buscar completions do mes atual + bonus do mes
// monthlyScore = earned_this_month + bonus_this_month
```

### Alteracoes em `useProfile.ts`

Adicionar campo `monthlyScore` ao `ProfileData`, buscando completions filtradas pelo mes atual.

### Alteracoes em `UserPointsCard.tsx`

- Redesenhar layout: Score Mensal como numero principal
- Mover pontos acumulados para secao secundaria
- Mostrar breakdown: base mensal + bonus mensal = score mensal

### Alteracoes em `EmployeeDashboard.tsx`

- Usar `monthlyScore` do `usePoints` para exibicao principal
- Adicionar banner informativo sobre o reset mensal
- Manter barra de progresso do rank com pontos acumulados

### Alteracoes em `ProfileHeader.tsx`

- Sem alteracoes (usa pontos acumulados para rank - correto)

### Alteracoes em `Profile.tsx`

- Adicionar card "Score do Mes" separado
- Renomear card existente para "Historico Total"

### Alteracoes em `EmployeePerformance.tsx`

- O score de performance pode opcionalmente mostrar dados mensais em vez de all-time

## Arquivos Modificados

1. `src/hooks/usePoints.ts` - Adicionar calculo de score mensal
2. `src/hooks/useProfile.ts` - Adicionar monthlyScore ao ProfileData
3. `src/components/dashboard/UserPointsCard.tsx` - Redesenhar com Score Mensal em destaque
4. `src/components/dashboard/EmployeeDashboard.tsx` - Usar score mensal + banner informativo
5. `src/pages/Profile.tsx` - Separar score mensal de historico
6. `src/components/rewards/PointsDisplay.tsx` - Mostrar saldo (acumulado, sem alteracao logica)

## O que NAO muda

- Logica do Leaderboard (ja e mensal)
- Sistema de Ranks (usa historico, correto)
- Sistema de Conquistas (usa historico, correto)
- Sistema de Medalhas (usa historico, correto)
- Checklists, fechamento de caixa, receitas
- Sistema de resgate de recompensas (saldo acumulado)
- Nenhuma tabela no banco de dados precisa ser criada ou modificada

