

## Plano: Simplificar ícone de diamante (Gem) nos módulos bloqueados

O diamante atualmente está dentro de um círculo com fundo e borda (`rounded-full`, `background`, `border`). O usuário quer apenas o ícone solto, com cor amarela pura.

### Alterações

#### 1. `src/components/layout/MoreDrawer.tsx` (~linha 247-251)
- Remover o `<span>` container com `rounded-full`, `background` e `border`
- Deixar apenas o `<AppIcon name="Gem">` posicionado no canto, com cor amarela direta (`hsl(45 90% 55%)`)
- Aumentar levemente o tamanho do ícone (de 8 para 10) para compensar a ausência do fundo

#### 2. `src/components/layout/BottomTabBar.tsx` (~linha 256-260)
- Mesma mudança: remover container circular, deixar só o ícone Gem amarelo
- Tamanho de 7 para 9

