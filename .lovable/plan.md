
# Bonus Separado, Pagina de Conquistas da Equipe e Simplificacao

## Resumo das Mudancas

4 grandes melhorias:
1. **Bonus com cor propria** -- separar visualmente pontos base dos bonus no perfil e leaderboard
2. **Pagina "Conquistas da Equipe"** -- nova aba no modulo Funcionarios (visivel para todos) mostrando conquistas e medalhas de todos
3. **Secao "Como Ganhar Bonus"** -- guia explicativo + acompanhamento das conquistas de alto valor com cooldown
4. **Simplificar conquistas de titulos** -- reorganizar as 18 conquistas atuais, remover redundancias e deixar mais claro

---

## 1. Bonus com Cor Propria

**Onde:** Perfil (`Profile.tsx`), Leaderboard (`Leaderboard.tsx`), UserPointsCard

Os pontos bonus vao usar a cor **laranja/amber** (neon-amber) enquanto os pontos base continuam em verde. No card de pontos do perfil, adicionar uma terceira coluna "Bonus" com icone de chama e cor distinta.

**Arquivos a editar:**
- `src/pages/Profile.tsx` -- separar grid de pontos: Ganhos (verde), Gastos (vermelho), Bonus (laranja), Saldo (ciano). Bonus em destaque com fundo amber/10
- `src/components/dashboard/Leaderboard.tsx` -- nos itens do ranking, mostrar "Base" e "Bonus" com cores diferentes lado a lado
- `src/components/dashboard/UserPointsCard.tsx` -- adicionar indicador de bonus do mes com cor amber

---

## 2. Pagina "Conquistas da Equipe"

Nova aba no modulo de Funcionarios visivel para **todos** (nao apenas admin), onde qualquer funcionario pode ver as conquistas, medalhas e bonus de todos os colegas.

**Novo componente:** `src/components/employees/TeamAchievements.tsx`
- Lista todos os funcionarios da unidade com seus avatares rankeados
- Para cada funcionario: conquistas desbloqueadas, medalhas ganhas, bonus do mes
- Expandir para ver detalhes (accordion ou click para ir ao perfil)
- Filtro por categoria (Tarefas, Pontos, Resgates, Medalhas)

**Arquivo a editar:** `src/pages/Employees.tsx`
- Adicionar aba "Conquistas" visivel para admin E funcionario
- Para funcionarios, adicionar essa aba alem de Holerites e Folgas

**Hook:** `src/hooks/useTeamAchievements.ts`
- Busca dados de todos os funcionarios da unidade (profiles + completions + redemptions + bonus_points)
- Calcula conquistas e medalhas para cada um
- RLS ja permite que authenticated veja profiles e completions

---

## 3. Secao "Como Ganhar Bonus"

Adicionar no componente `TeamAchievements` ou como secao separada um guia visual mostrando:

**Novo componente:** `src/components/employees/BonusGuide.tsx`
- Lista as 5 conquistas de alto valor (HIGH_VALUE_BADGES do useBonusPoints)
- Para cada uma: icone, titulo, pontos, como desbloquear, cooldown (semanal/mensal)
- Status do usuario atual: "Ja conquistou esta semana" ou "Disponivel"
- Visual de cards com cor amber, layout limpo

Integrado na aba "Conquistas" como secao superior antes da lista de conquistas de todos.

---

## 4. Simplificar Conquistas de Titulos

As conquistas atuais misturam 3 categorias (Tarefas, Pontos, Resgates) com 18 itens. Vamos:

**Arquivo a editar:** `src/lib/achievements.ts`
- Manter apenas conquistas com nomes claros e intuitivos
- Remover redundancia de nomes entre conquistas e ranks (ex: "Aprendiz" existe como conquista E como rank)
- Renomear para evitar confusao: conquistas de pontos terao nomes diferentes dos ranks
- Simplificar descricoes para serem mais diretas

**Arquivo a editar:** `src/components/profile/AchievementList.tsx`
- Mostrar apenas conquistas desbloqueadas em destaque, com as bloqueadas em tamanho menor
- Adicionar label de raridade visivel (Comum, Raro, Epico, Lendario)
- Progresso mais claro: "23/50" com barra, sem poluir visualmente

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/components/employees/TeamAchievements.tsx` -- pagina de conquistas da equipe
- `src/hooks/useTeamAchievements.ts` -- hook para buscar dados de todos
- `src/components/employees/BonusGuide.tsx` -- guia de como ganhar bonus

### Arquivos a editar:
- `src/pages/Profile.tsx` -- bonus separado com cor amber
- `src/pages/Employees.tsx` -- nova aba Conquistas (para todos)
- `src/components/dashboard/Leaderboard.tsx` -- cores separadas base vs bonus
- `src/components/dashboard/UserPointsCard.tsx` -- indicador de bonus
- `src/lib/achievements.ts` -- renomear/simplificar conquistas
- `src/components/profile/AchievementList.tsx` -- layout mais limpo

### Sem mudancas no banco de dados
Todos os dados necessarios ja existem (profiles, checklist_completions, reward_redemptions, bonus_points). RLS existente ja permite leitura dos dados necessarios.
