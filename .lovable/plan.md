

## Agrupar Lista de Pessoas em Opção Colapsável

### Problema
Quando o admin clica num item do checklist, a lista completa de pessoas aparece imediatamente, ocupando muito espaço e poluindo a interface. O ideal é mostrar primeiro apenas as opções principais ("Quem realizou?", "Já estava pronto", "Não fiz") e só expandir a lista de pessoas ao clicar em "Quem realizou?".

### Solução
Transformar a seção "Quem realizou?" em um botão colapsável. Ao clicar, expande a lista de pessoas com animação. As opções "Já estava pronto" e "Não fiz" ficam sempre visíveis.

### Mudanças

**Arquivo: `src/components/checklists/ChecklistView.tsx`**

1. Adicionar um estado local `expandedPeopleFor` (string | null) que controla qual item está com a lista de pessoas expandida.

2. **Seção admin do checklist standard (linhas ~530-543)** e **seção admin do checklist bônus (linhas ~844-858)**: Em ambos os blocos, substituir a renderização direta da lista de pessoas por:
   - Um botão "Quem realizou?" com ícone de chevron (ChevronDown/ChevronUp) que ao clicar faz toggle do `expandedPeopleFor`
   - A lista de pessoas fica condicionada a `expandedPeopleFor === item.id`
   - Animação suave de expand/collapse

3. Reordenar as opções do admin para ficarem nesta ordem:
   - **"Quem realizou?"** (colapsável) — com pontos
   - **"Já estava pronto"** — sem pontos
   - **"Não fiz"** — sem pontos

### Resultado Visual

```text
┌──────────────────────────────┐
│  👥 Quem realizou?        ▸  │  ← botão, clicável
├──────────────────────────────┤
│  🔄 Já estava pronto         │
│     Sem pontos (eu marquei)  │
├──────────────────────────────┤
│  ✕  Não fiz                  │
│     Sem pontos               │
└──────────────────────────────┘

Após clicar em "Quem realizou?":

┌──────────────────────────────┐
│  👥 Quem realizou?        ▾  │
│  ┌────────────────────────┐  │
│  │ 👤 Gabriele Bonaita    │  │
│  │ 👤 garden sjbv         │  │
│  │ 👤 Lucilene Pereira    │  │
│  │ 👤 Maria               │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  🔄 Já estava pronto         │
├──────────────────────────────┤
│  ✕  Não fiz                  │
└──────────────────────────────┘
```

### Arquivos Editados (1 arquivo)

| Arquivo | Mudança |
|---------|---------|
| `src/components/checklists/ChecklistView.tsx` | Estado `expandedPeopleFor`, 2 blocos admin refatorados (standard + bônus), import ChevronDown/ChevronRight |

