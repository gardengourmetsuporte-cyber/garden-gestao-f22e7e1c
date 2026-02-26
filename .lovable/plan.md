

## Plano: Experiência Premium com Diamante e Módulos Travados

### Configuração definida pelo usuário

**FREE** (sem pagar): Dashboard, Agenda, Checklists, Estoque + Pedidos
**PRO** (R$97/mês, diamante amarelo): Financeiro, Fechamento de Caixa, Fichas Técnicas, Funcionários, Ranking, Recompensas, Finanças Pessoais
**BUSINESS** (R$197/mês, diamante amarelo): Marketing, Copilot IA
**OCULTOS** (não aparecem no menu): Cardápio, Tablets, Gamificação, WhatsApp

---

### Alterações

#### 1. Atualizar mapeamento de módulos (`src/lib/plans.ts`)
- Adicionar módulos faltantes ao `MODULE_REQUIRED_PLAN`: `finance`, `cash-closing`, `employees`, `ranking`, `rewards` como `pro`
- Manter `marketing` e `copilot` como `business`
- Remover `menu-admin`, `tablet-admin`, `gamification`, `whatsapp` do mapeamento (serão ocultos)

#### 2. Atualizar MoreDrawer (`src/components/layout/MoreDrawer.tsx`)
- Remover do array `navItems` os módulos ocultos: Cardápio, Tablets, Gamificação, WhatsApp
- Trocar o ícone de cadeado (`Lock`) por diamante (`Gem`) com cor amarela dourada (`hsl(45 90% 55%)`)
- Adicionar label "PRO" ou "BUSINESS" pequeno abaixo do diamante nos cards travados
- Garantir que ao clicar em módulo travado, navega para `/plans`

#### 3. Atualizar BottomTabBar (`src/components/layout/BottomTabBar.tsx`)
- Verificar se módulos PRO na barra inferior mostram indicador de diamante quando travados (ex: Financeiro no slot 3)
- Se o módulo está travado, ao tocar redirecionar para `/plans` ao invés da rota do módulo

#### 4. Card de Planos no Menu Drawer
- O botão de Planos (coroa dourada) já existe para admins — garantir que aparece para TODOS os usuários no plano free (não só admins), pois o cliente precisa ver a opção de upgrade

#### 5. Página de Planos (`src/pages/Plans.tsx`)
- Manter como está — já funciona bem para free (cards de preço) e para assinantes (gerenciamento)

---

### Detalhes técnicos

- O ícone `Gem` do Lucide será usado como diamante amarelo com `style={{ color: 'hsl(45 90% 55%)' }}`
- Módulos ocultos são simplesmente removidos do array `navItems` no MoreDrawer
- A lógica de `isModuleLocked` já existe e usa `MODULE_REQUIRED_PLAN` + `planSatisfies` — basta atualizar o mapeamento
- O botão de Planos no drawer será visível para todos os usuários (remover condição `isAdmin`)

