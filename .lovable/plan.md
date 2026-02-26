

# Sprint 1 — Bottom Tab Bar Global + Header Simplificado

Este sprint transforma completamente a navegação mobile do app, substituindo o FAB Launcher por uma Bottom Tab Bar moderna e simplificando o header de 8 para 3 elementos.

---

## Escopo e Impacto

A mudança afeta **apenas o mobile** (< 768px). Desktop sidebar permanece inalterada. Isso toca primariamente o `AppLayout.tsx` (647 linhas) e o `index.css` (1354 linhas), com ajustes de padding em diversas páginas.

---

## Parte 1: Bottom Tab Bar Global

### Novo componente `src/components/layout/BottomTabBar.tsx`

Barra fixa inferior com 5 slots, visível em todas as páginas (exceto páginas que já têm bottom nav própria como Finance e PersonalFinance):

```text
┌──────────────────────────────────────────┐
│   Home   │  Checklists  │  ⊕  │ Estoque │ Mais │
│    ○     │      ○       │ ●●● │    ○    │  ○   │
└──────────────────────────────────────────┘
```

- **Home** (/) — sempre visível
- **Checklists** (/checklists) — módulo mais usado por funcionários
- **+** (centro) — FAB contextual, abre um bottom sheet com ações rápidas (Nova transação, Novo item estoque, etc.)
- **Estoque** (/inventory) — segundo módulo mais operacional
- **Mais** — abre um bottom sheet com grid de todos os módulos (estilo atual do launcher, mas como sheet, não fullscreen)

A seleção dos 4 módulos fixos é baseada nos módulos mais acessados. Se o usuário não tem acesso a um módulo, ele é substituído pelo próximo disponível.

### Lógica do "+"

O botão central abre um `Drawer` (vaul) com ações contextuais baseadas na rota atual:
- **Dashboard**: Criar transação, Abrir checklist
- **Qualquer página**: Ações genéricas (Nova transação, Novo item, Novo checklist)

### Lógica do "Mais"

O botão "Mais" abre um `Drawer` com:
- Profile card do usuário (avatar + nome + rank)
- Grid de módulos (idêntico ao launcher atual, mas sem fullscreen overlay)
- Seletor de unidade
- Botão de logout

### Indicadores visuais

- Aba ativa: ícone com cor `primary`, pill indicator animado (reutilizar `.nav-pill-indicator` do CSS)
- Badges de notificação nos ícones (chat, notificações)
- Module status indicators (dots verde/amarelo/vermelho)

---

## Parte 2: Header Simplificado

### De (atual — 8 elementos):
```text
[ThemeToggle] [Copilot] [Points] ... [Logo] ... [Ranking] [Chat] [Notificações]
```

### Para (novo — 3 elementos):
```text
[UnitName/Logo] ........................ [Notificações] [Avatar]
```

- **Esquerda**: Nome da unidade ativa com o ícone Atlas (clicável → vai pro dashboard)
- **Direita**: Sino de notificações (com badge) + Avatar do usuário (clicável → abre drawer de perfil rápido ou navega pro perfil)
- ThemeToggle → movido para Settings e para o drawer "Mais"
- Points → visível no Profile card dentro do drawer "Mais"
- Copilot → acessível via drawer "Mais" ou Bottom Tab se tiver acesso
- Ranking/Chat → acessíveis via drawer "Mais"

---

## Parte 3: Remoção do FAB Launcher

Remover completamente do `AppLayout.tsx`:
- FAB button (linhas 252-281)
- Home button acima do FAB (linhas 236-250)
- Launcher overlay fullscreen (linhas 283-504)
- Variável `launcherOpen` e lógica associada
- `fabBottom` calculation

Remover do `index.css`:
- `.launcher-overlay`, `.launcher-item`, `.launcher-content` styles
- `.fab-idle-glow`, `.fab-close-spin`, `.launcher-home-btn` animations
- `.fab-neon-border` (mantém apenas para FinanceBottomNav que ainda usa)

---

## Parte 4: Ajustes de Padding

Todas as páginas que usam `AppLayout` precisam de `pb-24` (bottom tab bar height + safe area). Páginas com bottom nav própria (Finance, PersonalFinance, Chat) já têm padding adequado e o BottomTabBar será ocultado nessas rotas.

---

## Arquivos Afetados

```text
NOVOS:
├── src/components/layout/BottomTabBar.tsx     — componente principal (bottom tabs)
├── src/components/layout/MoreDrawer.tsx       — drawer "Mais" com grid de módulos
├── src/components/layout/QuickActionSheet.tsx  — sheet do botão "+"

EDITADOS:
├── src/components/layout/AppLayout.tsx        — remover FAB/launcher, adicionar BottomTabBar, simplificar header
├── src/index.css                              — limpar estilos do launcher, adicionar estilos do tab bar
├── src/pages/DashboardNew.tsx                 — ajustar padding se necessário
```

Nenhuma alteração de banco de dados.

---

## Detalhes de Implementacao

### BottomTabBar

- Renderizado via `createPortal(document.body)` (mesmo padrão do `FinanceBottomNav`)
- Hidden em desktop (`lg:hidden`)
- Z-index: `z-50` (abaixo de sheets/drawers que usam z-80+)
- Safe area: `paddingBottom: env(safe-area-inset-bottom)`
- Altura: `h-16` (64px) — padrão iOS/Android
- Background: `bg-card/95 backdrop-blur-2xl` (mesmo estilo do FinanceBottomNav)
- Top glow line: `h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent`
- Hidden quando a rota é `/finance`, `/personal-finance`, `/chat` (essas têm nav própria)

### MoreDrawer

- Usa `Drawer` (vaul) — componente já disponível no projeto
- Conteúdo idêntico ao launcher atual mas dentro de um drawer (não fullscreen)
- Inclui: profile card, unit selector, module grid agrupado, planos (crown), logout
- Max-height: `70vh` com scroll

### QuickActionSheet

- `Drawer` simples com 3-4 ações rápidas
- Estilo similar ao menu radial do FinanceBottomNav mas em lista vertical
- Ações: Nova Receita, Nova Despesa, Novo Item, dependendo dos módulos acessíveis

### Header

- Altura mantida em `h-14` (56px)
- Estrutura: `flex items-center justify-between`
- Left: `<img Atlas icon>` + `<span unitName>`
- Right: `<NotifBell>` + `<Avatar small>`

---

## Riscos e Mitigacoes

1. **Páginas com bottom nav própria**: Finance, PersonalFinance e Chat já têm bottom nav. O BottomTabBar será ocultado nessas rotas via prop ou detecção de pathname.

2. **Módulos restritos**: O tab bar respeita `useUserModules()` — se o usuário não tem acesso a Checklists, o slot mostra o próximo módulo disponível.

3. **FAB de módulos específicos**: Inventory tem seu próprio FAB. O `+` central do BottomTabBar será ocultado ou adaptado nessas páginas para não conflitar.

---

## Resultado Esperado

- **Navegação**: 1 tap para Home, Checklists, Estoque (vs. 2 taps no launcher atual)
- **Header**: Visual limpo com 3 elementos (vs. 8 atuais)
- **Percepção**: App moderno alinhado com Nubank, Mobills, iFood
- **Código**: ~150 linhas removidas do AppLayout (launcher), ~200 linhas em 3 novos componentes compactos

