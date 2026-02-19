

# Correções: Calendário da Agenda + Bug de Scroll

## Problema 1: Tarefas sem data aparecendo no calendário

O componente `AgendaCalendarView.tsx` possui uma seção "Sem data definida" (linhas 202-230) que lista todas as tarefas sem `due_date` abaixo do calendário. Na visão de calendário, isso nao faz sentido -- essas tarefas ja aparecem corretamente na visão de lista.

**Correção:** Remover a seção "Sem data definida" do `AgendaCalendarView.tsx` (linhas 199-235). O calendário passa a mostrar apenas tarefas COM data atribuída.

---

## Problema 2: Página subindo e descendo sozinha

O arquivo `main.tsx` tem um sistema de estabilização de foco para iOS (linhas 38-75) que usa `window.scrollTo()` com múltiplos `setTimeout` (50ms, 150ms, 350ms). Esse sistema foi criado para prevenir saltos do teclado virtual, mas pode conflitar com:
- Eventos de toque do dnd-kit (drag and drop)
- Scroll natural da página quando não há overlay aberto
- Interações rápidas que disparam `focusin` repetidamente

**Correção:** Refinar o sistema de focus handling para:
1. Verificar se o foco realmente veio de uma interação do usuário (não de eventos programáticos)
2. Usar `requestAnimationFrame` em vez de múltiplos `setTimeout` para restaurar posição
3. Adicionar um guard para evitar conflitos quando dnd-kit está ativo (verificando se existe um elemento com `[data-dnd-dragging]` ou se o evento veio de dentro de um container sortable)

---

## Arquivos modificados

### `src/components/agenda/AgendaCalendarView.tsx`
- Remover bloco de "Sem data definida" (linhas 199-235)
- O calendário mostra apenas tarefas com data, e ao clicar num dia mostra as tarefas daquele dia

### `src/main.tsx`
- Refinar o handler de `focusin` para:
  - Ignorar eventos quando dnd-kit está ativo
  - Reduzir os setTimeout de 3 para 1 (apenas o de 150ms como fallback)
  - Adicionar debounce para evitar chamadas repetidas de `scrollTo`

---

## Impacto

- Zero mudanças no banco de dados
- Apenas 2 arquivos editados
- A visão de lista continua mostrando todas as tarefas (com e sem data) normalmente
- O scroll fica estável no mobile sem afetar a correção do teclado virtual em overlays

