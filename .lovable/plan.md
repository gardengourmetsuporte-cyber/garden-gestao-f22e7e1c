

# Adicionar Finanças Pessoais ao Menu do App Launcher

## Problema
O módulo "Finanças Pessoais" foi registrado em `modules.ts` e a rota existe em `App.tsx`, mas falta a entrada na lista `navItems` do `AppLayout.tsx` -- que é o array que gera o menu de módulos (FAB).

## Solução
Adicionar uma entrada no array `navItems` em `src/components/layout/AppLayout.tsx`:

```
{ icon: 'Wallet', label: 'Finanças Pessoais', href: '/personal-finance', group: 'pessoal', groupLabel: 'Pessoal' }
```

Sem `adminOnly`, já que é um módulo pessoal acessível a qualquer usuário logado.

## Detalhes Técnicos

### Arquivo editado
- `src/components/layout/AppLayout.tsx` -- adicionar 1 linha no array `navItems` (após a linha do Chat, antes de Settings)

Nenhuma outra alteração necessária. A rota e o módulo já existem.
