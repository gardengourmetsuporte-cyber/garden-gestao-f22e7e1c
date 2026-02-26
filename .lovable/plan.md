

# Auto-encerramento de Checklists por Prazo

## Regras de Negócio

- **Abertura**: prazo até **07:30** do mesmo dia. Após esse horário, todos os itens não preenchidos são automaticamente marcados como "não fiz" (is_skipped = true, 0 pontos).
- **Fechamento**: prazo até **02:00 do dia seguinte**. Após esse horário, mesma lógica — itens pendentes viram "não fiz".
- **Bônus**: sem prazo de encerramento automático (tarefas extras opcionais).
- Admins continuam podendo interagir após o prazo (podem desmarcar/remarcar).

## Abordagem

A lógica será **client-side**: quando a página de checklists carrega (ou quando o tipo/data muda), o sistema verifica se o prazo expirou. Se sim, busca os itens ativos sem completion e faz um batch upsert marcando todos como `is_skipped = true`.

Isso evita a necessidade de uma Edge Function agendada (cron) e garante que o encerramento aconteça na primeira vez que qualquer usuário abrir a tela após o prazo.

## Detalhes Técnicos

### Função `isDeadlinePassed(date, checklistType)`

```text
abertura + mesmo dia + hora >= 7:30  → true
fechamento + dia seguinte + hora >= 2:00  → true
fechamento + mesmo dia  → false (ainda não passou)
```

### Auto-mark logic (em `Checklists.tsx`)

Após `fetchCompletions` retornar, um `useEffect` verifica:
1. O prazo passou?
2. Existem itens ativos sem completion?
3. Se sim, faz batch insert de completions com `is_skipped: true, points_awarded: 0` para todos os pendentes.
4. Usa um ref `autoClosedRef` para evitar loops (executa uma vez por date+type).

### Bloqueio visual (em `ChecklistView.tsx`)

Quando o prazo expirou e o usuário não é admin:
- `canToggleItem` retorna `false` para itens não completados
- Um banner aparece no topo: "⏰ Prazo encerrado às 07:30 — itens pendentes marcados como 'não fiz'"

### Arquivos afetados

```text
src/pages/Checklists.tsx           — useEffect para auto-mark + função isDeadlinePassed
src/components/checklists/ChecklistView.tsx — banner de prazo expirado + bloqueio de interação
```

Nenhuma alteração de banco de dados necessária. Os completions de "não fiz" usam a mesma estrutura já existente (`is_skipped`, `awarded_points`, `points_awarded`).

