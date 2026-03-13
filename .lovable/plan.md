

# Auditoria de Qualidade — Bugs, Layout e Padrões

Após inspeção detalhada do código, identifiquei os seguintes problemas:

---

## Problemas Encontrados

### 1. Grid dinâmico no MoreDrawer (Tailwind não gera classes dinâmicas)
No `MoreDrawer.tsx` (linha 317), há uso de template string para grid:
```
`grid-cols-${lastRowItems.length}`
```
Tailwind **não gera classes dinâmicas** em runtime. Se `lastRowItems.length` for 1, a classe `grid-cols-1` pode não existir no bundle. Isso causa a última linha de módulos ficando com layout quebrado.

**Fix**: Usar mapa estático de classes (`{1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3'}`).

### 2. Uso direto de `material-symbols-rounded` sem AppIcon (inconsistência)
Em `Customers.tsx`, `Agenda.tsx`, `MessageCampaignSheet.tsx` e `CustomerImportCSV.tsx` há spans manuais com `material-symbols-rounded` sem `fontVariationSettings`, causando ícones com peso/fill diferente do padrão do sistema.

**Fix**: Substituir por `<AppIcon>` para garantir consistência visual.

### 3. StableNavIcon — checklists hardcoded
No `BottomTabBar.tsx` (linha 432), a condição `tab.key !== 'checklists'` está hardcoded, impedindo qualquer futuro custom icon para checklists. Isso não é um bug visual, mas uma limitação desnecessária que deveria ser tratada de forma mais limpa.

### 4. Bottom padding inconsistente entre páginas
Diferentes páginas usam `pb-24`, `pb-28`, `pb-32`, `pb-36` — sem padronização. Em telas com a barra inferior de 64px + safe-area, `pb-24` (96px) pode ser insuficiente, enquanto `pb-36` (144px) desperdiça espaço.

**Fix**: Padronizar para `pb-28 lg:pb-12` (112px mobile, 48px desktop).

### 5. FAB `bg-accent-foreground` pode ter contraste ruim
No `BottomTabBar.tsx` (linha 224), quando existe `fabAction`, o FAB usa `bg-accent-foreground` que em certos temas pode não ter contraste suficiente com o ícone branco.

---

## Plano de Correção (por prioridade)

### A. Corrigir grid dinâmico no MoreDrawer
- Substituir `grid-cols-${lastRowItems.length}` por mapa estático

### B. Padronizar ícones inline → AppIcon
- `Customers.tsx`: 3 instâncias
- `Agenda.tsx`: ~5 instâncias  
- `MessageCampaignSheet.tsx`: ~5 instâncias
- `CustomerImportCSV.tsx`: 1 instância

### C. Padronizar bottom padding das páginas
- Normalizar para `pb-28 lg:pb-12` nas ~15 páginas que usam valores diferentes

### D. FAB color safety
- Substituir `bg-accent-foreground` por gradiente explícito com contraste garantido

---

## Detalhes Técnicos

- **Grid fix**: `const gridColsMap: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' };`
- **Ícones**: Cada `<span className="material-symbols-rounded" style={{fontSize: N}}>name</span>` vira `<AppIcon name="name" size={N} />`
- **Padding**: Todas as páginas com `AppLayout` wrapper terão padding bottom unificado

