

# Hub de Pontos e Ranking

## Objetivo
Centralizar tudo relacionado a pontos, ranking, conquistas e bonus em uma unica pagina dedicada (`/ranking`), acessivel por um icone no header do app (ao lado do chat e notificacoes). Remover as abas "Performance" e "Conquistas" do modulo de Funcionarios. Simplificar o sistema de conquistas eliminando medalhas e raridades, deixando apenas uma lista linear de objetivos vinculados a progressao de rank.

## O que muda

### 1. Nova pagina `/ranking` (Hub Central)
Uma pagina unica com scroll vertical contendo:
- **Seu perfil resumido** no topo (avatar rankeado, rank atual, barra de progresso para o proximo rank, pontos do mes)
- **Ranking Mensal** (componente Leaderboard ja existente, com seletor de mes)
- **Objetivos** (lista simplificada - substitui conquistas + medalhas): uma unica lista de metas com barra de progresso, sem categorias, sem raridades, sem tiers. Cada objetivo mostra titulo, progresso atual/meta e se esta desbloqueado
- **Bonus do Mes** (lista de bonus recebidos + guia de como ganhar bonus)
- **Admin: Dar Bonus** (botao para admins darem bonus a funcionarios, ja existente no BonusPointSheet)

### 2. Icone no Header
Adicionar um icone de trofeu (Trophy) no header principal, entre o chat e as notificacoes, que navega para `/ranking`. Opcional: badge com a posicao do usuario no ranking.

### 3. Simplificacao das Conquistas
- Eliminar o sistema de **medalhas** (`MedalList`, `lib/medals.ts`) da nova pagina
- Eliminar **raridades** (comum, raro, epico, lendario) e **categorias** (tarefas, pontos, resgates)
- Transformar em uma lista simples de **Objetivos** com titulo, descricao, icone, progresso e status (desbloqueado ou nao)
- Manter os mesmos objetivos existentes (14 conquistas), apenas com visual simplificado

### 4. Remover do Modulo de Funcionarios
- Remover a aba "Performance" (`EmployeePerformance`)
- Remover a aba "Conquistas" (`TeamAchievements`)
- O modulo de Funcionarios fica com: Funcionarios, Ponto, Folgas (admin) ou Ponto, Holerites, Folgas (employee)

## Detalhes Tecnicos

### Arquivos novos
- `src/pages/Ranking.tsx` - Pagina hub com todas as secoes
- `src/components/ranking/ObjectivesList.tsx` - Lista simplificada de objetivos (substitui AchievementList + MedalList)
- `src/components/ranking/MyRankCard.tsx` - Card resumo do usuario com rank e progresso

### Arquivos modificados
- `src/App.tsx` - Adicionar rota `/ranking`
- `src/components/layout/AppLayout.tsx` - Adicionar icone Trophy no header (mobile e desktop)
- `src/pages/Employees.tsx` - Remover abas Performance e Conquistas
- `src/lib/achievements.ts` - Simplificar removendo raridades/categorias (ou criar nova versao)

### Arquivos que continuam existindo (sem alteracao)
- `src/pages/Profile.tsx` - Continua mostrando o perfil individual (pode linkar para /ranking)
- `src/hooks/useLeaderboard.ts` - Reutilizado na pagina de ranking
- `src/hooks/usePoints.ts` - Reutilizado
- `src/components/dashboard/Leaderboard.tsx` - Reutilizado na pagina de ranking
- `src/components/employees/BonusPointSheet.tsx` - Reutilizado para admins darem bonus

### Fluxo do usuario
1. Abre o app -> ve icone de trofeu no header (ao lado do chat)
2. Clica -> abre `/ranking`
3. Ve seu rank, posicao, pontos do mes, ranking completo, objetivos e bonus
4. Admin pode dar bonus diretamente dali

