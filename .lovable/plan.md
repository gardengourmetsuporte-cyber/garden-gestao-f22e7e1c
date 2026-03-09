

## Analise Completa de Comunicacao — Inconsistencias Encontradas

Fiz uma varredura em todos os arquivos do sistema. Segue a lista organizada de problemas e sugestoes:

---

### 1. INCONSISTENCIAS DE NOMENCLATURA (mesmo conceito, nomes diferentes)

| Onde aparece | Atual | Problema | Sugestao |
|---|---|---|---|
| modules.ts | `Dashboard` | Ingles, resto do sistema e em portugues | `Painel` ou manter `Dashboard` (padrao SaaS) |
| modules.ts | `Obrigacoes Legais` | Nome longo | OK, mas no navItems.ts esta so `Obrigacoes` — **inconsistente** |
| plans.ts | `IA Copiloto` | Na nav e modulos e `Copilot IA` | Padronizar para **`Copilot IA`** em todos os lugares |
| plans.ts | `WhatsApp Bot` | Na nav e modulos e `WhatsApp IA` | Padronizar para **`WhatsApp IA`** |
| landing (Hero/Solution/Pricing) | `IA Copiloto` | Diferente de `Copilot IA` | Padronizar para **`Copilot IA`** |
| landing (Pricing) | `WhatsApp Bot` | Diferente de `WhatsApp IA` | Padronizar para **`WhatsApp IA`** |
| Documentation.tsx | `WhatsApp Bot` (titulo) | Diferente do modulo | Padronizar para **`WhatsApp IA`** |
| Documentation.tsx (planos) | `IA Copiloto` / `WhatsApp Bot` | Desalinhado com modulos | Alinhar |
| modules.ts | `Pedidos` (orders) | Na navItems e `Fornecedores` | O modulo orders aparece como "Pedidos" nos modulos mas "Fornecedores" na nav — **potencialmente confuso** mas parece intencional |
| navItems.ts | `Fechamento` | OK, mas no CashClosing.tsx aparece `Fechamento de Caixa` e `Novo Fechamento de Caixa` | Manter consistente: `Fechamento de Caixa` |
| modules.ts group | `Principal` | Memoria e nav dizem `Inicio` | Padronizar grupo para **`Inicio`** |
| Settings.tsx | `Custos de Receitas` | Em modules.ts e `Custos de producao` | Padronizar: **`Custos de Producao`** |
| modules.ts children | `Brand Core` (marketing) | Termo em ingles sem contexto | Traduzir para **`Identidade da Marca`** ou manter (e comum em marketing) |

---

### 2. BOTOES E ACOES COM PADRAO INCONSISTENTE

| Local | Atual | Sugestao |
|---|---|---|
| Agenda FAB | `Novo Lembrete` | Agenda tem tarefas e compromissos, nao so lembretes. Sugestao: **`Nova Tarefa`** |
| Compliance FAB | `Nova Obrigacao` | OK |
| Compliance EmptyState | `Cadastrar` | Muito generico. Sugestao: **`Nova Obrigacao`** |
| Inventory FAB | `Novo Item` | OK |
| Customers FAB | `Novo cliente` (minusculo) | Padronizar caixa: **`Novo Cliente`** |

---

### 3. TEXTOS QUE PODEM MELHORAR A COMUNICACAO

| Local | Atual | Sugestao |
|---|---|---|
| Settings > Lojas | `Gerenciar suas lojas` | OK |
| Settings > Checklists | `Setores, itens e pontuacao` | Mais claro: **`Gerenciar setores e itens de checklist`** |
| Settings > Equipe | `Membros, convites e niveis de acesso` | OK, claro |
| UpgradeWall | `Este recurso esta disponivel no plano...` | OK |
| Plans.tsx | `O plano Business inclui Marketing, Copilot IA, WhatsApp Bot...` | Corrigir `WhatsApp Bot` para `WhatsApp IA` |
| BottomTabBar Config label | `Mais` (dentro do cardapio) | Deveria ser **`Config`** ja que e a aba de configuracoes |

---

### 4. TERMOS EM INGLES QUE PODEM CONFUNDIR

| Termo | Onde | Sugestao |
|---|---|---|
| `Dashboard` | modules.ts, Documentation | Manter (padrao SaaS aceito) |
| `Brand Core` | Marketing submodulo | Pode manter (comum em marketing) ou traduzir para `Identidade da Marca` |
| `Checklists` | Varios | Manter (termo ja adotado no Brasil) |
| `Ranking` | Varios | Manter |
| `Backup` | Settings | Manter |

---

### 5. RESUMO DAS ALTERACOES RECOMENDADAS

1. **`IA Copiloto` → `Copilot IA`** em: plans.ts, landing (Hero, Solution, Pricing), Documentation.tsx
2. **`WhatsApp Bot` → `WhatsApp IA`** em: plans.ts, landing (Pricing), Documentation.tsx, Plans.tsx
3. **`Principal` → `Inicio`** em: modules.ts (group dos modulos dashboard e agenda)
4. **`Obrigacoes Legais` ↔ `Obrigacoes`** — padronizar para `Obrigacoes Legais` em ambos (modules.ts e navItems.ts)
5. **`Custos de producao` ↔ `Custos de Receitas`** — padronizar para `Custos de Producao` em Settings.tsx
6. **`Novo cliente`** → `Novo Cliente` (capitalizar) em Customers.tsx FAB
7. **`Cadastrar`** → `Nova Obrigacao` no EmptyState do Compliance
8. **`Novo Lembrete`** → `Nova Tarefa` no FAB da Agenda
9. **ConfigButton label `Mais`** → `Config` no BottomTabBar (aba cardapio)
10. **`Fechamento`** → `Fechamento de Caixa` no navItems.ts para clareza

### Arquivos que serao alterados:
- `src/lib/plans.ts`
- `src/lib/modules.ts`
- `src/lib/navItems.ts`
- `src/pages/Settings.tsx`
- `src/pages/Customers.tsx`
- `src/pages/Compliance.tsx`
- `src/pages/Agenda.tsx`
- `src/pages/Plans.tsx`
- `src/pages/Documentation.tsx`
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/SolutionSection.tsx`
- `src/components/landing/PricingSection.tsx`
- `src/components/layout/BottomTabBar.tsx`

