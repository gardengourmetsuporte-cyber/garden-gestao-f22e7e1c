

# Refatoracao Visual: "Dark Command Center"

Refatoracao puramente visual/UX de todo o aplicativo, mantendo 100% das funcionalidades, dados e logica de negocio intactos. Inspirado na referencia enviada (estilo central de controle com bordas neon e cards assimetricos).

---

## Fase 1: Design System (Base CSS + Tokens)

**Arquivo: `src/index.css`**

- Ajustar tokens de cor para fundo mais profundo (preto azulado mais intenso)
- Adicionar tokens de glow neon (cyan, verde, vermelho, amarelo) para bordas dos cards
- Criar novas classes utilitarias:
  - `.card-command` -- card principal com borda gradient neon (estilo da referencia)
  - `.card-command-success` -- borda verde sutil
  - `.card-command-danger` -- borda vermelha sutil
  - `.card-command-warning` -- borda amarela/laranja sutil
  - `.card-command-info` -- borda cyan/azul sutil
- Glassmorphism mais pronunciado nos cards (bg mais translucido, blur mais forte)
- Atualizar sombras para glows coloridos sutis

**Arquivo: `tailwind.config.ts`**
- Adicionar animacao `glow-border` para pulso sutil nas bordas neon
- Adicionar cores de glow neon nos tokens

---

## Fase 2: Header Mobile e Sidebar

**Arquivo: `src/components/layout/AppLayout.tsx`**

Header mobile:
- Transformar em "barra de status" com informacoes contextuais
- Mostrar nome do usuario, badge admin, e icone de notificacoes com contador
- Visual mais denso e informativo (menos "vazio")
- Borda inferior com glow sutil

Sidebar:
- Icones maiores (w-6 h-6 em vez de w-5 h-5)
- Item ativo com borda lateral luminosa (borda esquerda neon azul) em vez de apenas fundo
- Separadores visuais entre grupos de modulos
- Avatar com anel luminoso
- Badges de alerta nos itens relevantes (estoque critico, pendencias)

---

## Fase 3: Finance Home (Referencia principal)

**Arquivo: `src/components/finance/FinanceHome.tsx`**

Redesign inspirado diretamente na imagem de referencia:

1. **Card Saldo Principal** (dominante, assimetrico):
   - Ocupar largura total com padding generoso
   - Borda com gradiente neon (cyan -> roxo -> azul, como na referencia)
   - Numero do saldo em fonte extra-grande (~text-4xl) com cor cyan
   - Fundo escuro com leve transparencia
   - Sombra com glow da borda

2. **Cards Receita/Despesa** (dupla, menores):
   - Grid 2 colunas
   - Borda verde sutil para receitas, vermelha para despesas
   - Icones de seta com mais presenca
   - Valores em negrito, labels discretos

3. **Card Pendencias**:
   - Borda laranja/amarela
   - Layout mais claro com valores coloridos (vermelho para despesas, verde para receitas)

4. **Botoes de Acao** (Receita, Despesa, Transf.):
   - Estilo circular com icone no centro (como na referencia)
   - Label abaixo do icone
   - Bordas coloridas circulares (verde, vermelho, azul)

5. **Lista de Contas**:
   - Cards menores com borda sutil baseada na cor da conta

**Arquivo: `src/components/finance/MonthSelector.tsx`**
- Visual mais integrado ao header, menos "solto"

---

## Fase 4: Finance Bottom Nav

**Arquivo: `src/components/finance/FinanceBottomNav.tsx`**

- Fundo com glassmorphism mais forte (bg-card/80 backdrop-blur-2xl)
- Borda superior com glow sutil
- FAB central com gradiente e glow animado
- Item ativo com indicador luminoso (dot ou barra inferior brilhante)

---

## Fase 5: Dashboard Admin

**Arquivo: `src/components/dashboard/AdminDashboard.tsx`**

- Card de boas-vindas com borda neon sutil
- **Card Saldo do Mes** dominante (maior que os outros, colspan-2 no grid)
- Cards secundarios (Pedidos, Fichas, Estoque) menores e assimetricos
- Secao "Acoes Pendentes" com cards de alerta coloridos por urgencia:
  - Vermelho: itens zerados
  - Amarelo: estoque baixo, fechamentos
  - Azul: resgates, despesas
- Quick Access com icones maiores e efeito hover com glow
- Leaderboard com visual refinado

---

## Fase 6: Dashboard Employee

**Arquivo: `src/components/dashboard/EmployeeDashboard.tsx`**

- Mesmo tratamento visual do admin (cards com bordas neon)
- Card de pontos com borda dourada/amber

---

## Fase 7: Finance Transactions e Charts

**Arquivo: `src/components/finance/FinanceTransactions.tsx`**
- Summary header com visual "command center" (bordas e glows)
- Date headers com mais presenca visual

**Arquivo: `src/components/finance/TransactionItem.tsx`**
- Icones de tipo mais expressivos (fundo colorido arredondado)
- Valores com mais destaque visual

**Arquivo: `src/components/finance/FinanceCharts.tsx`**
- Tabs com estilo mais refinado
- Graficos com cores consistentes com o novo design system
- Cards de categoria na lista com bordas laterais coloridas

---

## Fase 8: Tela de Login

**Arquivo: `src/pages/Auth.tsx`**
- Orbs de fundo mais pronunciadas
- Card de login com borda neon sutil
- Botao de submit com glow

---

## Fase 9: Componentes compartilhados

**Arquivo: `src/components/finance/FinanceMore.tsx`**
- Menu items com bordas e icones maiores

**Arquivo: `src/components/dashboard/Leaderboard.tsx`**
- Cards de ranking com bordas laterais coloridas por posicao
- Top 3 com glow sutil

**Arquivo: `src/components/dashboard/UserPointsCard.tsx`**
- Borda dourada/amber no card inteiro

---

## Resumo de Arquivos Modificados

| Arquivo | Tipo de mudanca |
|---|---|
| `src/index.css` | Novos tokens, classes utilitarias, glows |
| `tailwind.config.ts` | Animacoes e tokens de glow |
| `src/components/layout/AppLayout.tsx` | Header + Sidebar redesign |
| `src/components/finance/FinanceHome.tsx` | Redesign completo (referencia) |
| `src/components/finance/FinanceBottomNav.tsx` | Glassmorphism + glow |
| `src/components/finance/MonthSelector.tsx` | Estilo integrado |
| `src/components/finance/FinanceTransactions.tsx` | Visual refinado |
| `src/components/finance/TransactionItem.tsx` | Icones e valores |
| `src/components/finance/FinanceCharts.tsx` | Tabs e cores |
| `src/components/finance/FinanceMore.tsx` | Menu refinado |
| `src/components/dashboard/AdminDashboard.tsx` | Cards assimetricos + alertas |
| `src/components/dashboard/EmployeeDashboard.tsx` | Mesmo tratamento |
| `src/components/dashboard/Leaderboard.tsx` | Bordas e glow |
| `src/components/dashboard/UserPointsCard.tsx` | Borda amber |
| `src/pages/Auth.tsx` | Glow no login |

## Restricoes Mantidas

- Zero alteracoes em logica de negocios, hooks, queries ou tipos
- Todos os modulos, rotas e fluxos permanecem identicos
- Apenas classes CSS, estrutura JSX visual e estilos sao modificados
- Nenhuma funcionalidade removida ou escondida

## Nota sobre escopo

Esta e uma refatoracao extensa (15+ arquivos). Para garantir qualidade, sugiro implementar em 2-3 mensagens: primeiro o design system base + financeiro (fases 1-4), depois dashboards (fases 5-7), e por fim login e componentes restantes (fases 8-9).

