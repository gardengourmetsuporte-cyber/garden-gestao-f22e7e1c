

# Fix: Horário Limite não funciona

## Problema
Duas causas raízes identificadas:

1. **DeadlineSettingPopover não re-sincroniza estado local**: O componente usa `useState` inicializado com `currentSetting` no mount. Quando o popover é reaberto após salvar (e a query refetcha), o estado interno (hour, minute, isActive, etc.) não atualiza — mantém os valores antigos.

2. **Display "Sem limite configurado" mesmo com toggle ativo**: O texto mostra `formatDeadlineSetting(currentSetting)` que é null antes do primeiro save. Após salvar, como o estado local não re-sincroniza, o label do popover fica desatualizado.

## Solução

### `src/components/checklists/DeadlineSettingPopover.tsx`
- Adicionar `useEffect` para re-sincronizar os estados locais (`hour`, `minute`, `isNextDay`, `isActive`) sempre que `currentSetting` mudar (após o refetch da query).
- Atualizar o texto de display para mostrar o horário formatado baseado nos valores locais (não apenas no `currentSetting`), para que mesmo antes de salvar o usuário veja o que está configurando.

```tsx
// Adicionar sync effect
useEffect(() => {
  setHour(currentSetting?.deadline_hour ?? defaults.hour);
  setMinute(currentSetting?.deadline_minute ?? defaults.minute);
  setIsNextDay(currentSetting?.is_next_day ?? defaults.nextDay);
  setIsActive(currentSetting?.is_active ?? true);
}, [currentSetting]);

// Atualizar display text
const displayLabel = isActive 
  ? `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}${isNextDay ? ' (dia seguinte)' : ''}`
  : 'Desativado';
```

Mudança mínima em 1 arquivo, sem alterações de banco de dados.

