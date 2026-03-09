

## Ajuste do layout do chat do Copiloto

### Problema
O container do chat usa `h-[calc(100vh-3.5rem)]` que não desconta a altura da barra de navegação inferior (mobile). O `pb-20` na barra de input tenta compensar, mas cria espaço morto e o input fica parcialmente coberto pela tab bar.

### Solução
1. **Ajustar altura do container** para descontar a tab bar no mobile: `h-[calc(100vh-3.5rem-5rem)]` (mobile) e manter `lg:h-[calc(100vh)]` (desktop sem tab bar)
2. **Remover o `pb-20`** excessivo da barra de input e usar `pb-3` uniforme
3. **Adicionar `pb-2`** na área de mensagens para breathing room antes do input

### Arquivo editado
- `src/pages/Copilot.tsx` — ajustar classes do container principal e da barra de input

