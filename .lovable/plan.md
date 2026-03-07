

## Plano: Substituir a faixa de datas por DatePicker no Checklists

### O que muda
Trocar o componente `UnifiedDateStrip` (faixa horizontal com os dias da semana) pelo `DatePicker` (botão que abre um calendário popover) na página de Checklists, mantendo o mesmo padrão limpo usado no resto do sistema.

### Alterações

**`src/pages/Checklists.tsx`**
- Remover import do `UnifiedDateStrip` e de `subDays`
- Importar `DatePicker` de `@/components/ui/date-picker`
- Substituir o bloco `<UnifiedDateStrip ... />` por um `<DatePicker>` com o botão de lembrete (`reminderBtn`) ao lado
- Remover a geração do array `days` (não será mais necessário)
- Layout: flexbox com o DatePicker ocupando a largura principal e o reminderBtn ao lado direito

### Resultado
Um seletor de data compacto estilo botão + popover calendário, consistente com o resto do app, em vez da faixa horizontal scrollável.

