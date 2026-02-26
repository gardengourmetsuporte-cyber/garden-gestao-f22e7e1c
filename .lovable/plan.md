

## Plano: Contestação dinâmica inline (mesmo padrão de execução de tarefa)

### Problema atual
A contestação aparece como um botão "Contestar" separado abaixo do card completado, fora do fluxo natural. O admin quer que ao clicar no card concluído, abra o painel expandido inline (mesmo padrão do `openPopover`) com a opção de contestar junto com a opção de desmarcar.

### Solução
Unificar a interação: quando o admin clica num item **concluído**, o card expande um painel inline (igual ao painel de "Concluí agora / Não fiz / Já pronto") com as opções:
1. **Desmarcar** (se permitido) — botão para reverter a conclusão
2. **Contestar** — botão amber que ao clicar revela o campo de motivo inline dentro do mesmo painel

Isso elimina o botão "Contestar" avulso abaixo do card e torna a experiência consistente.

### Alterações em `ChecklistView.tsx`

**Comportamento atual dos items concluídos:**
- Clique no card concluído → tenta desmarcar diretamente (onClick inline)
- Botão "Contestar" separado aparece abaixo

**Novo comportamento:**
- Clique no card concluído (admin) → abre painel expandido inline (`openPopover === item.id`)
- Dentro do painel:
  - Opção "Desmarcar item" (ícone undo, se canToggle)
  - Opção "Contestar" (ícone AlertTriangle, amber) — ao clicar, troca para o input de motivo + botão enviar
- Para funcionários, clique no card concluído mantém o comportamento atual (desmarcar direto se dentro da janela de 5 min)

### Detalhes técnicos

1. **Card concluído (admin)**: Em vez de `onClick → desmarcar`, faz `onClick → setOpenPopover(item.id)` (toggle)
2. **Painel expandido para item concluído**: Novo bloco renderizado quando `openPopover === item.id && completed`:
   - Botão "Desmarcar" com ícone de undo
   - Botão "Contestar" → ao clicar, muda para input inline (mesmo visual amber atual)
   - Botão "Cancelar" para fechar
3. **Remove** o botão "Contestar" avulso que fica abaixo do card
4. **Aplica em ambas as seções**: Bonus (flat list) e Standard (subcategory > items) — o padrão é duplicado então ambos precisam ser atualizados

### Arquivos a editar
- `src/components/checklists/ChecklistView.tsx` — única alteração necessária

### Visual do painel expandido (item concluído, admin)

```text
┌─────────────────────────────────────┐
│ ✓ Limpar balcão    +2 pts          │  ← card concluído (clicável)
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  ↩ Desmarcar item                  │  ← reverte a conclusão
│  ─────────────────────────────────  │
│  ⚠ Contestar                       │  ← abre input motivo
│  ─────────────────────────────────  │
│  [Motivo da contestação...] [➤] [✕]│  ← aparece ao clicar Contestar
└─────────────────────────────────────┘
```

