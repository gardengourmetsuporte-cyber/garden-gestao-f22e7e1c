

## Plano: Bloqueio por plano + lazy loading nas Configurações

### Problema 1: Configurações sem bloqueio por plano
Items como "Métodos de Pagamento", "Custos de Receitas", "Recompensas", "Medalhas" pertencem a módulos Pro/Business mas aparecem desbloqueados para usuários Free.

### Problema 2: Carregamento lento
Todos os 12 componentes de configuração são importados no topo do arquivo (eager), carregando código desnecessário antes do usuário clicar.

---

### Alterações

#### 1. `src/pages/Settings.tsx` — Mapeamento de plano por item + lazy loading

**Adicionar campo `requiredPlan`** a cada `MenuItem` que corresponde a um módulo pago:

| Setting item | Módulo correspondente | Plano |
|---|---|---|
| `payments` | `finance` | `pro` |
| `costs` | `recipes` | `pro` |
| `rewards` | `rewards` | `pro` |
| `medals` | `ranking` | `pro` |
| `suppliers` | `inventory` | `free` |
| `categories` | `inventory` | `free` |
| `checklists` | `checklists` | `free` |
| `team` | — | `free` |
| `profile` | — | `free` |
| `notifications` | — | `free` |
| `audit-log` | — | `free` |
| `units` | — | `free` |

**Na renderização da lista:** Se o plano do usuário não satisfaz o `requiredPlan`, mostrar o item com opacidade reduzida + badge "PRO"/"BUSINESS" + ao clicar redirecionar para `/plans` ao invés de abrir o componente.

**Lazy loading:** Trocar todos os imports estáticos dos componentes de configuração por `React.lazy()` e envolver o componente ativo em `<Suspense>` com um skeleton/spinner.

#### 2. Visual do bloqueio
Mesmo padrão do menu lateral: item visível mas com indicador de plano (💎 PRO) e ao clicar navega para `/plans`.

### Resultado
- Itens de configuração de módulos pagos ficam bloqueados para usuários Free
- Página de configurações abre instantaneamente (lazy loading dos componentes)
- Padrão visual consistente com o resto do app

