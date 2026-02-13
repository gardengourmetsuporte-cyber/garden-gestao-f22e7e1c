
# Dashboard como Tela Inicial de Celular

## Visao Geral

Duas mudancas principais para tornar o dashboard uma experiencia identica a tela inicial de um celular:

1. **Arraste sempre ativo no Dashboard** - Nao precisa mais clicar em "Editar". Widgets sao sempre arrastáveis via long-press (segurar), assim como icones na tela de um celular.
2. **Arrastar do menu lateral para o Dashboard** - Os modulos no sidebar terao um botao "+" que adiciona o widget correspondente diretamente ao dashboard.

---

## 1. Dashboard Sempre Arrast vel (Sem Botao "Editar")

Atualmente, o arraste so funciona quando o usuario clica em "Editar". A mudanca remove esse modo e torna o arraste sempre ativo via long-press:

- Remover o botao "Editar/Concluir" e o estado `isEditing`
- Widgets ficam sempre arrastáveis via long-press (300ms)
- Ao segurar um widget, ele "levanta" (escala + sombra) e pode ser movido
- Ao soltar, ele encaixa na nova posicao
- Manter os botoes de "Resetar", "Adicionar" e remover/redimensionar sempre visíveis de forma discreta

### Comportamento Visual

- **Estado normal**: Widgets aparecem normalmente, clicáveis para navegar
- **Long-press (segurar)**: Widget "levanta" com escala 1.03 e sombra, entra em modo arraste
- **Arrastando**: Widget acompanha o dedo, outros widgets se rearranjam
- **Soltar**: Widget encaixa suavemente na nova posicao
- Botoes de remover (X) e redimensionar (P/M/G) ficam sempre visíveis em cada widget

---

## 2. Adicionar Widget pelo Menu Lateral

Cada item do menu lateral ganha um botao "+" discreto que adiciona o modulo como widget no dashboard (se ainda nao estiver la):

- Ao lado de cada item do menu, um icone "+" aparece se o widget correspondente ainda nao esta no dashboard
- Clicar no "+" adiciona o widget e mostra um toast de confirmacao
- O mapeamento entre rotas do menu e tipos de widget sera feito por uma tabela de correspondencia

---

## Resumo Tecnico

### Arquivos Editados

| Arquivo | Descricao |
|---------|-----------|
| `src/components/dashboard/WidgetGrid.tsx` | Remover estado `isEditing`, tornar DnD sempre ativo, manter botoes de acao sempre visíveis |
| `src/components/dashboard/WidgetWrapper.tsx` | Remover condicional `disabled: !isEditing` do useSortable, mostrar botoes X e resize sempre, remover animacao wiggle |
| `src/hooks/useDashboardLayout.ts` | Remover estado `isEditing` e `setIsEditing` |
| `src/components/layout/AppLayout.tsx` | Adicionar botao "+" ao lado dos itens do menu lateral que correspondem a widgets, usando `useDashboardLayout` para verificar quais widgets ja existem e para chamar `addWidget` |

### Mapeamento Rota -> Widget

Uma tabela de correspondencia sera adicionada para conectar as rotas do menu lateral aos tipos de widget:

```text
/finance    -> metric_balance
/inventory  -> metric_critical
/recipes    -> metric_recipes
/rewards    -> points
/checklists -> quick_access
/           -> welcome
```

Apenas os modulos que possuem widget correspondente mostrarao o botao "+" no menu lateral.
