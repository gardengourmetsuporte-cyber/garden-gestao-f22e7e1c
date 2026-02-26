

## Plan: Unificar módulos no padrão card com layout adaptativo

### Contexto
Atualmente os módulos estão em grid 4 colunas com ícones pequenos, enquanto Agenda e Configurações usam cards horizontais (`rounded-xl bg-secondary/50` com ícone circular + label + chevron). O pedido é colocar todos os módulos nesse mesmo padrão de card, mas dividindo o espaço horizontalmente de acordo com a quantidade de itens no grupo.

### Abordagem
Substituir o grid de ícones por uma grade de cards horizontais que se adaptam ao número de itens:
- Cada grupo renderiza seus itens em um `grid` com colunas dinâmicas baseado no `items.length`
- Se 3 itens: `grid-cols-3` — cada card ocupa 1/3 da largura
- Se 4 itens: `grid-cols-2` com 2 linhas (2x2), preenchendo bem o espaço
- Se 6 itens: `grid-cols-3` com 2 linhas (3x2)
- Cada card segue o mesmo visual do card de Agenda/Configurações: `rounded-xl bg-secondary/50`, ícone circular à esquerda, label ao lado

### Mudanças no arquivo

**`src/components/layout/MoreDrawer.tsx`**:

1. **Remover o card isolado de Agenda** (linhas 169-181) — Agenda passa a ser um item normal dentro do seu grupo ou adicionado ao `navItems`

2. **Substituir o bloco "Module grid"** (linhas 183-237) por um layout adaptativo:
   - Para cada grupo, calcular `cols` baseado em `items.length`:
     - 1 item: full-width (como Agenda atual)
     - 2 items: `grid-cols-2`
     - 3 items: `grid-cols-3`
     - 4+ items: `grid-cols-2` (2 por linha, cards maiores)
   - Cada item renderiza como card vertical compacto: ícone circular centralizado + label abaixo, dentro de `rounded-xl bg-secondary/50`, ocupando todo o espaço da célula
   - Cards com `flex flex-col items-center justify-center gap-1.5 py-3 px-2`

3. **Manter Configurações e Sair** no padrão atual (card horizontal full-width com chevron), pois são ações de sistema

### Layout visual esperado

```text
┌─────────────────────────────────────┐
│ [Gestão]                            │
│ ┌──────────┬──────────┬──────────┐  │
│ │  💰      │  📦      │  🛒      │  │
│ │Financeiro│ Estoque  │ Pedidos  │  │
│ └──────────┴──────────┴──────────┘  │
│                                     │
│ [Operação]                          │
│ ┌──────────┬──────────┬──────────┐  │
│ │  ✅      │  🧾      │  👨‍🍳     │  │
│ │Checklists│Fechamento│Fichas Téc│  │
│ └──────────┴──────────┴──────────┘  │
│                                     │
│ [Pessoas]                           │
│ ┌──────────┬──────────┬──────────┐  │
│ │  👥      │  🎁      │  🏆      │  │
│ │Funcionár.│Recompens.│ Ranking  │  │
│ └──────────┴──────────┴──────────┘  │
│                                     │
│ [Premium] - 6 items = 3x2           │
│ ┌──────────┬──────────┬──────────┐  │
│ │Marketing │ Copilot  │ WhatsApp │  │
│ ├──────────┼──────────┼──────────┤  │
│ │ Cardápio │ Tablets  │Gamificaç.│  │
│ └──────────┴──────────┴──────────┘  │
│                                     │
│ [⚙️ Configurações          >]       │
│ [🚪 Sair da conta          >]       │
└─────────────────────────────────────┘
```

Cada card de módulo terá o estilo `rounded-xl bg-secondary/50 hover:bg-secondary active:bg-secondary/80` com ícone circular `w-9 h-9 rounded-full bg-muted` centralizado e label abaixo, mantendo consistência visual com Agenda/Configurações mas em formato compacto vertical.

