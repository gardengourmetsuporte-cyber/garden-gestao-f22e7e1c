
# Correção: Data Mostrando Dia Anterior no Checklist

## Diagnóstico do Bug

O bug ocorre na linha 152 do `ChecklistView.tsx`:

```tsx
{format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
```

### Causa Raiz

Quando uma string de data no formato `'yyyy-MM-dd'` (ex: `'2025-02-03'`) é passada para `new Date()`:

1. JavaScript interpreta como **meia-noite UTC** (00:00 UTC)
2. No Brasil (UTC-3), isso equivale a **21:00 do dia anterior**
3. Portanto, o `format()` exibe o dia anterior

### Exemplo do Bug

```text
Data selecionada: '2025-02-03' (terça-feira)
new Date('2025-02-03') = 2025-02-03T00:00:00Z (UTC)
                       = 2025-02-02T21:00:00 (horário do Brasil)
                       
Resultado: mostra "segunda-feira, 2 de fevereiro" ao invés de "terça-feira, 3 de fevereiro"
```

---

## Solução

Usar a função `parseISO` do `date-fns` que faz o parsing correto sem conversão de fuso horário:

```tsx
// ANTES (com bug)
format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })

// DEPOIS (corrigido)
import { parseISO } from 'date-fns';
format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })
```

Alternativamente, podemos criar a data manualmente adicionando o horário local:

```tsx
// Opção 2: Criar data no horário local
format(new Date(date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })
```

---

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/checklists/ChecklistView.tsx` | Adicionar import de `parseISO` e substituir `new Date(date)` por `parseISO(date)` |

---

## Código da Correção

```typescript
// Linha 2 - Adicionar parseISO ao import
import { format, parseISO } from 'date-fns';

// Linha 152 - Substituir new Date(date) por parseISO(date)
<p className="text-sm text-muted-foreground">
  {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
</p>
```

---

## Resultado Esperado

Após a correção, o card de resumo exibirá a mesma data selecionada no seletor de data:

| Seletor de Data | Card de Resumo |
|-----------------|----------------|
| terça-feira, 03 de fevereiro | terça-feira, 3 de fevereiro |

---

## Seção Técnica

### Por que `parseISO` funciona?

A função `parseISO` do `date-fns` interpreta a string como **data local**, não UTC:

```typescript
// new Date() - interpreta como UTC
new Date('2025-02-03') 
// → Mon Feb 02 2025 21:00:00 GMT-0300 (horário local brasileiro)

// parseISO - interpreta como data local
parseISO('2025-02-03')
// → Mon Feb 03 2025 00:00:00 GMT-0300 (horário local brasileiro)
```

Isso garante que o dia exibido seja sempre o mesmo que foi selecionado, independentemente do fuso horário.
