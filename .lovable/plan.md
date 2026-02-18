
# Reformulacao do Sistema de Gamificacao

## Resumo
Substituir o sistema atual de conquistas (3 categorias: Tarefas, Pontos, Resgates) e medalhas genericas por:
1. **Sistema de Elo unico** - Uma unica lista de ranking/elo progressivo (tipo LoL) que substitui as conquistas por categoria
2. **Medalhas especiais** - Apenas 2 medalhas realmente significativas para comecar (ex: Funcionario do Mes)

O ranking de elo ja existe parcialmente (`src/lib/ranks.ts` com Iniciante -> Imortal), mas nao e exibido como lista de progressao. As conquistas atuais (14 itens em 3 categorias) serao removidas e substituidas pela lista de elos.

---

## O que muda

### 1. Lista de Elos (substitui "Conquistas/Objetivos")
A aba "Objetivos" no Ranking Hub e a secao "Conquistas" no Perfil serao substituidas por uma **lista visual de elos** mostrando a progressao do usuario:

| Elo | Pontos | Borda |
|-----|--------|-------|
| Iniciante | 0+ | Cinza simples, sem efeito |
| Aprendiz | 10+ | Verde com glow suave |
| Dedicado | 25+ | Ciano com pulso |
| Veterano | 50+ | Roxo com anel duplo |
| Mestre | 100+ | Dourado com orbita + coroa |
| Lenda | 300+ | Vermelho fogo com chamas |
| Mitico | 750+ | Arco-iris com efeito rainbow |
| Imortal | 1500+ | Prismatico multicolorido |

Cada elo na lista mostrara: avatar com a borda animada correspondente, nome do elo, pontos necessarios, e barra de progresso se nao desbloqueado.

### 2. Medalhas Especiais (substitui medalhas genericas)
Apenas 2 medalhas iniciais, realmente memoraveis:
- **Funcionario do Mes** - Concedida pelo admin (usa sistema de bonus existente com `badge_id`)
- **Primeiro Dia Perfeito** - Completou 100% das tarefas em um unico dia

### 3. Bordas com efeito de movimento
As bordas SVG existentes nos rank-frames ja possuem animacoes (flames, orbit, pulse). Elas serao utilizadas na lista de elos para que o usuario veja como sera sua borda ao atingir cada nivel.

---

## Detalhes Tecnicos

### Arquivos removidos/simplificados:
- `src/lib/achievements.ts` - Reescrito para exportar a lista de elos em vez de conquistas por categoria
- `src/components/profile/AchievementList.tsx` - Reescrito como `EloList.tsx` mostrando a progressao de elos
- `src/components/ranking/ObjectivesList.tsx` - Atualizado para usar a nova lista de elos

### Arquivos modificados:
- `src/lib/medals.ts` - Simplificado para apenas 2 medalhas especiais
- `src/components/profile/MedalList.tsx` - Atualizado para exibir as novas medalhas
- `src/pages/Profile.tsx` - Trocar `AchievementList` por `EloList`
- `src/hooks/useProfile.ts` - Remover calculo de achievements antigo, usar elos
- `src/hooks/useTeamAchievements.ts` - Simplificar para usar elos
- `src/components/employees/TeamAchievements.tsx` - Atualizar referencias

### Nova lista de elos (logica):
A lista reutiliza os ranks existentes de `src/lib/ranks.ts` e mostra todos os 8 niveis com:
- Avatar preview com a borda animada do elo
- Nome e cor do elo
- Pontos minimos para desbloquear
- Status: desbloqueado (check) ou progresso (barra)
- Elo atual destacado com borda brilhante

### Medalhas novas:
- **Funcionario do Mes**: verificado pelo campo `badge_id = 'employee_of_month'` na tabela `bonus_points`
- **Primeiro Dia Perfeito**: calculado verificando se houve um dia onde todas as tarefas do checklist foram completadas
