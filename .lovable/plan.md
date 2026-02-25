

# Time Blocks — Modo Pomodoro Visual na Agenda

## Visao Geral

Uma nova aba na Agenda chamada **"Blocos"** que exibe 24 blocos de tempo (um por hora, de 00:00 ate 23:00), organizados **de baixo para cima** (o bloco do meio-dia fica no topo visivel). O usuario arrasta tarefas do dia para dentro dos blocos, criando uma timeline visual do dia inteira. Estetica futurista, gamificada, interacao rapida como Apple Pay.

```text
┌─────────────────────────────┐
│  ☀ 12:00 - encerra          │  ← topo (ultimo bloco)
│  🔲 11:00 - 12:00           │
│  🔲 10:00 - 11:00           │
│  🔲 09:00 - 10:00  [Tarefa] │  ← tarefa alocada
│  🔲 08:00 - 09:00           │
│       ...                   │
│  🌙 00:00 - 01:00           │  ← base (primeiro bloco)
└─────────────────────────────┘
     ┌──────────────┐
     │ Tarefas do dia│  ← gaveta inferior com tarefas para arrastar
     └──────────────┘
```

## Design Visual (Futurista / Game-like)

- **Blocos vazios**: fundo escuro translucido com borda neon sutil (cyan/emerald glow), label do horario em fonte monospacada
- **Bloco com tarefa**: brilho intensificado, cor da categoria da tarefa como accent, icone pulsante
- **Bloco "agora"**: destaque especial com anel animado (ring pulse) indicando o horario atual
- **Gaveta de tarefas**: painel inferior colapsavel com as tarefas pendentes do dia (due_date = hoje) ou sem data, prontas para serem arrastadas para um bloco
- **Arrastar tarefa**: drag-and-drop do painel inferior para um bloco, com feedback haptico e animacao de "snap"
- **Scroll automatico**: ao abrir, rola ate o bloco do horario atual

## Implementacao Tecnica

### Novo componente: `src/components/agenda/TimeBlocksView.tsx`
- Renderiza 24 blocos (0-23h), ordenados de baixo (00:00) para cima (23:00) usando `flex-col-reverse`
- Cada bloco mostra horario e tarefa alocada (se houver)
- Auto-scroll para o bloco da hora atual via `useEffect` + `scrollIntoView`
- Estado local `allocations: Record<number, string>` mapeando hora -> task_id
- Gaveta inferior com tarefas pendentes do dia, filtraveis
- Drag-and-drop usando `@dnd-kit` (ja instalado) para mover tarefas para blocos
- Toque rapido em bloco vazio abre picker de tarefas (alternativa ao drag para mobile)
- Persistencia local via `localStorage` por dia (chave: `timeblocks-YYYY-MM-DD`) — sem necessidade de nova tabela no banco por enquanto (modo experimental)

### Modificacao: `src/pages/Agenda.tsx`
- Adicionar terceira aba "Blocos" no seletor de viewMode (list | calendar | **blocks**)
- Renderizar `<TimeBlocksView>` quando `viewMode === 'blocks'`
- Passar tarefas pendentes e funcoes de toggle/edit

### Sem mudancas no banco de dados
- As alocacoes ficam em localStorage como experimento
- Se o usuario gostar, futuramente criamos uma tabela `time_block_allocations`

## Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/components/agenda/TimeBlocksView.tsx` |
| Editar | `src/pages/Agenda.tsx` — adicionar aba "Blocos" e renderizar novo componente |

