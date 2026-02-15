
# Reformulacao do Sistema de Conquistas, Medalhas e Bordas

## Resumo

Vamos transformar o sistema de gamificacao em algo muito mais envolvente, com:
1. **Bordas de avatar dramaticamente diferentes** por rank (com efeitos visuais unicos)
2. **Conquistas expandidas** com metas mais distantes e categorias variadas
3. **Sistema de Medalhas** novo para feitos unicos/especiais
4. **Visual premium** nos cards de conquista e medalha

---

## 1. Bordas de Avatar por Rank (mais chamativas)

Cada rank tera um estilo visual totalmente distinto, nao apenas mudanca de cor:

| Rank | Pontos | Borda | Efeito |
|------|--------|-------|--------|
| Iniciante | 0+ | Fina cinza, sem efeito | Nenhum |
| Aprendiz | 10+ | Verde neon solida | Glow suave |
| Dedicado | 25+ | Ciano com pulse lento | Pulse glow |
| Veterano | 50+ | Roxo com borda dupla | Borda dupla + glow |
| Mestre | 100+ | Dourado com particulas | Ring orbit animation |
| Lenda | 300+ | Vermelho fogo, chamas | Fire glow pulsante |
| Mitico | 750+ | Arco-iris rotativo + aura | Conic gradient + outer ring |
| Imortal (NOVO) | 1500+ | Diamante cristalino, prismatico | Prisma multi-layer + shimmer |

**Arquivo:** `src/lib/ranks.ts` -- adicionar rank "Imortal" (1500+) e ajustar "Lenda" para 300 e "Mitico" para 750.

**Arquivo:** `src/components/profile/RankedAvatar.tsx` -- refatorar para suportar efeitos visuais mais complexos (ring externo animado, borda dupla, shimmer).

**Arquivo:** `src/index.css` -- novas animacoes: `rankOrbit` (particulas orbitando), `rankFireGlow` (pulsacao fogo), `rankPrismaShimmer` (brilho diamante), `rankDoubleRing` (anel duplo).

---

## 2. Conquistas Expandidas (metas mais distantes)

Ampliar de 11 para ~20 conquistas com metas progressivas mais desafiadoras:

**Tarefas:**
- Primeiro Passo (1), Fiel Escudeiro (10), Incansavel (50), Centuriao (100), **Titanique (250)**, **Inabalavel (500)**, **Maquina (1000)**

**Pontos:**
- Aprendiz (10), Dedicado (25), Veterano (50), Mestre (100), Lenda (200), Mitico (500), **Imortal (1000)**, **Transcendente (2000)**

**Resgates:**
- Colecionador (1), **Viciado (5)**, **Shopping (15)**

**Arquivo:** `src/lib/achievements.ts` -- adicionar novas conquistas com icones unicos.

---

## 3. Sistema de Medalhas (NOVO)

Medalhas sao premiacao por feitos unicos e especiais, diferentes de conquistas (que sao progressivas). Calculadas no frontend a partir dos dados existentes.

**Exemplos de Medalhas:**
- **Madrugador** -- completou tarefa antes das 7h
- **Perfeicionista** -- completou todas as tarefas de um dia
- **Sequencia de Fogo** -- 7 dias seguidos completando tarefas
- **Primeiro do Mes** -- primeiro lugar no ranking mensal
- **Velocista** -- completou 5 tarefas em 1 hora
- **Multitarefa** -- completou tarefas em 3+ categorias no mesmo dia

Como algumas medalhas precisam de dados de timestamps que ja existem em `checklist_completions.completed_at`, podemos calcular varias delas no frontend.

**Novos arquivos:**
- `src/lib/medals.ts` -- definicoes e logica de calculo
- `src/components/profile/MedalList.tsx` -- componente visual

**Arquivo:** `src/hooks/useProfile.ts` -- buscar dados extras (completed_at) para calcular medalhas.

---

## 4. Visual Premium dos Cards

**Conquistas:**
- Cards com gradiente de fundo baseado na raridade (comum, raro, epico, lendario)
- Icone maior com glow quando desbloqueado
- Barra de progresso mostrando % ate desbloquear
- Efeito shimmer no card de conquistas lendarias

**Medalhas:**
- Visual diferente das conquistas: formato circular tipo "selo"
- Cores metalicas (bronze, prata, ouro, platina) baseadas na dificuldade
- Animacao de brilho ao ganhar

**Arquivo:** `src/components/profile/AchievementList.tsx` -- redesign completo com categorias (Tarefas, Pontos, Resgates), raridade visual, progresso.

---

## 5. Integracao na Pagina de Perfil

**Arquivo:** `src/pages/Profile.tsx` -- adicionar secao de Medalhas abaixo das Conquistas, com tabs ou secoes separadas.

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/lib/medals.ts`
- `src/components/profile/MedalList.tsx`

### Arquivos a editar:
- `src/lib/ranks.ts` -- novo rank Imortal, ajustar thresholds
- `src/lib/achievements.ts` -- ~9 novas conquistas, sistema de raridade
- `src/components/profile/RankedAvatar.tsx` -- efeitos visuais por rank
- `src/components/profile/AchievementList.tsx` -- redesign com raridade e progresso
- `src/hooks/useProfile.ts` -- buscar completed_at para medalhas
- `src/pages/Profile.tsx` -- integrar MedalList
- `src/index.css` -- novas animacoes de borda/rank

### Sem mudancas no banco de dados
Tudo calculado no frontend a partir de dados existentes (checklist_completions, reward_redemptions).
