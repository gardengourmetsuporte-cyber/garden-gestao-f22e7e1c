
# Perfil Publico, Titulos de Ranking e Molduras de Avatar

## Visao Geral

Criar um sistema de perfil publico para cada funcionario com conquistas, titulos baseados em ranking (inspirado no League of Legends) e molduras decorativas ao redor do avatar que refletem o nivel do usuario.

---

## 1. Sistema de Titulos e Molduras por Ranking

Definir faixas de pontos que geram titulos e molduras, similar ao sistema de elos do LoL:

```text
Pontos Ganhos    Titulo           Cor da Moldura
0-9              Iniciante        Cinza (border simples)
10-24            Aprendiz         Verde (neon verde)
25-49            Dedicado         Azul (neon cyan)
50-99            Veterano         Roxo (neon purple)
100-199          Mestre           Dourado (neon amber)
200-499          Lenda            Vermelho (neon red)
500+             Mitico           Gradiente animado (rainbow)
```

**Arquivo novo:** `src/lib/ranks.ts` -- funcoes puras que recebem `earned_points` e retornam titulo, cor, nivel e estilo da moldura.

---

## 2. Componente de Avatar com Moldura (`RankedAvatar`)

Um componente reutilizavel que envolve o avatar do usuario com uma borda decorativa baseada no ranking. Os niveis mais altos terao:
- Borda mais grossa com glow neon
- Animacao sutil de brilho rotativo para niveis altos (Lenda, Mitico)
- Badge com o titulo abaixo ou ao lado do avatar

**Arquivo novo:** `src/components/profile/RankedAvatar.tsx`

Sera usado em:
- Sidebar (substituir o avatar atual)
- Leaderboard (substituir o avatar simples)
- Pagina de Perfil Publico (versao grande)

---

## 3. Pagina de Perfil Publico

Nova rota `/profile/:userId` acessivel por qualquer usuario logado, mostrando:

- **Header**: Avatar grande com moldura de ranking + Nome + Titulo + Cargo
- **Card de Pontos**: Pontos ganhos, gastos, saldo (similar ao UserPointsCard)
- **Conquistas**: Lista de marcos atingidos (ex: "Primeira tarefa", "50 pontos", "100 tarefas")
- **Historico de Ranking**: Posicao atual no leaderboard

**Arquivos novos:**
- `src/pages/Profile.tsx` -- pagina principal
- `src/components/profile/AchievementList.tsx` -- lista de conquistas
- `src/components/profile/ProfileHeader.tsx` -- header com avatar grande + moldura

**Rota nova em `App.tsx`:** `/profile/:userId`

---

## 4. Sistema de Conquistas

Conquistas calculadas no frontend baseadas nos dados existentes (sem tabela nova no banco):

- "Primeiro Passo" -- Completou primeira tarefa
- "Fiel Escudeiro" -- 10 tarefas completadas
- "Incansavel" -- 50 tarefas completadas
- "Centuriao" -- 100 tarefas completadas
- "Colecionador" -- Resgatou primeira recompensa
- Conquistas por faixas de pontos (alinhadas com os titulos)

**Arquivo novo:** `src/lib/achievements.ts` -- logica pura para calcular conquistas

---

## 5. Integracao nos Componentes Existentes

- **Sidebar (`AppLayout.tsx`)**: Trocar avatar simples pelo `RankedAvatar`, adicionar titulo abaixo do nome. Clicar no card do usuario navega para `/profile/me`.
- **Leaderboard (`Leaderboard.tsx`)**: Usar `RankedAvatar` com moldura menor, mostrar titulo ao lado do nome.
- **Dashboard cards**: Links para perfis dos usuarios no ranking.

---

## 6. Hook de Dados do Perfil

**Arquivo novo:** `src/hooks/useProfile.ts`

Hook que busca dados de um usuario especifico (pontos, completions, redemptions) para montar a pagina de perfil. Reutiliza as funcoes de `src/lib/points.ts`.

---

## Resumo de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/lib/ranks.ts` | Criar | Logica de titulos, niveis e cores por pontos |
| `src/lib/achievements.ts` | Criar | Logica de conquistas baseada em dados existentes |
| `src/components/profile/RankedAvatar.tsx` | Criar | Avatar com moldura decorativa de ranking |
| `src/components/profile/ProfileHeader.tsx` | Criar | Header do perfil publico |
| `src/components/profile/AchievementList.tsx` | Criar | Lista de conquistas |
| `src/pages/Profile.tsx` | Criar | Pagina de perfil publico |
| `src/hooks/useProfile.ts` | Criar | Hook para dados do perfil |
| `src/App.tsx` | Editar | Adicionar rota `/profile/:userId` |
| `src/components/layout/AppLayout.tsx` | Editar | Usar RankedAvatar + titulo + link para perfil |
| `src/components/dashboard/Leaderboard.tsx` | Editar | Usar RankedAvatar + titulo no ranking |

Nenhuma alteracao no banco de dados e necessaria -- tudo e calculado a partir das tabelas existentes (`checklist_completions`, `reward_redemptions`, `profiles`).
