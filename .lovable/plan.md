

## Plano: Dois modos de visualização no Checklist

### Objetivo
Adicionar um toggle de modo de visualização na tela de Checklists: **"Completo"** (atual, lista todos os setores) e **"Meu Setor"** (funcionário escolhe um setor e vê apenas as tarefas daquele setor expandidas).

### UX

Abaixo dos cards Abertura/Fechamento, um toggle compacto com dois botões:
```text
[ 📋 Completo ] [ 🏷 Meu Setor ]
```

- **Completo**: comportamento atual, todos os setores colapsáveis
- **Meu Setor**: mostra um seletor de setor (chips horizontais), e ao selecionar exibe todas as subcategorias e itens daquele setor já expandidos, sem os outros setores

A escolha do setor fica salva em `localStorage` para persistir entre sessões.

### Alterações

**`src/pages/Checklists.tsx`**
- Novo state: `viewMode: 'full' | 'sector'` e `selectedSectorId: string | null`
- Renderizar toggle de modo entre os cards de tipo e o conteúdo
- Quando `viewMode === 'sector'`, mostrar chips de seleção de setor e filtrar `sectors` passados ao `ChecklistView` para apenas o setor escolhido
- Persistir `viewMode` e `selectedSectorId` no localStorage

**`src/components/checklists/ChecklistView.tsx`**
- Nova prop opcional `autoExpandAll?: boolean` — quando `true`, todos os setores e subcategorias iniciam expandidos (usado no modo "Meu Setor" para UX direta)

### Layout mobile (modo Meu Setor)

```text
[ Completo ] [ Meu Setor ✓ ]

[Cozinha] [Salão] [Caixa]  ← chips scroll horizontal
         ↓
┌─────────────────────┐
│ Subcategoria 1      │  (já expandida)
│  ☐ Item 1           │
│  ☑ Item 2           │
├─────────────────────┤
│ Subcategoria 2      │
│  ☐ Item 3           │
└─────────────────────┘
```

Nenhuma mudança de banco de dados necessária.

