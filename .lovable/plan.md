

# Mover "Central Recorrente" ao lado de "Financeiro"

Mover a entrada `Central Recorrente` (linha 58) para logo após `Financeiro` (linha 36) no array `NAV_ITEMS` em `src/lib/navItems.ts`.

## Alteração

**`src/lib/navItems.ts`** — reordenar o array:

```
// ── Gestão ──
Financeiro        ← já existe (linha 36)
Central Recorrente ← mover para cá (linha 37)
Clientes
Fornecedores
...
Marketing
Obrigações Legais  ← Central Recorrente sai daqui
```

Apenas 1 arquivo modificado, sem impacto funcional — só reordena a navegação.

