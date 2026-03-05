

## Sistema de IA Financeira para Auto-Categorização

O sistema atual tem dois problemas claros:
1. **Despesas do fechamento de caixa** são inseridas com `category_id: null` e sem `employee_id` (linhas 406-418 do `useCashClosing.ts`)
2. **Não existe inteligência** para categorizar transações automaticamente baseada no histórico

### Arquitetura Proposta

```text
Transação nova (qualquer origem)
         ↓
  Edge Function "finance-categorize"
         ↓
  IA recebe: descrição + lista de categorias + fornecedores + funcionários do usuário
         ↓
  Retorna: category_id sugerido, supplier_id, employee_id, confidence (0-1)
         ↓
  Se confidence >= 0.8 → aplica direto
  Se confidence < 0.8 → marca como "pendente de revisão" (campo suggestions no front)
```

### Componentes a Criar/Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `supabase/functions/finance-categorize/index.ts` | Edge function que recebe descrição + contexto do negócio (categorias, fornecedores, funcionários) e retorna categorização via IA (Gemini Flash) |
| Modificar | `src/hooks/useCashClosing.ts` | Na integração financeira (linhas 406-418), chamar a IA para categorizar cada despesa antes de inserir, atribuindo `category_id` e `employee_id` |
| Modificar | `src/components/finance/ReceiptOCRSheet.tsx` | Usar a mesma edge function para enriquecer as sugestões do OCR com match exato de IDs de categoria/fornecedor/funcionário |
| Criar | `src/hooks/useFinanceCategorize.ts` | Hook reutilizável que chama a edge function, faz cache local de mapeamentos já conhecidos (descrição→categoria) para evitar chamadas repetidas |

### Edge Function `finance-categorize`

Recebe:
```json
{
  "descriptions": ["Rafael", "Moto", "Julia", "Gabriel"],
  "categories": [{ "id": "...", "name": "Folha de Pagamento", "subcategories": [...] }, ...],
  "suppliers": [{ "id": "...", "name": "Fornecedor X" }],
  "employees": [{ "id": "...", "name": "Rafael Silva" }]
}
```

Retorna:
```json
{
  "results": [
    { "description": "Rafael", "category_id": "...", "employee_id": "...", "confidence": 0.95 },
    { "description": "Moto", "category_id": "...", "supplier_id": null, "confidence": 0.7, "question": "Moto é um gasto com transporte ou pagamento de motoboy?" }
  ]
}
```

- Usa `google/gemini-2.5-flash` com tool calling
- O prompt inclui todo o contexto do negócio (categorias, subcategorias, fornecedores, funcionários)
- Faz batch (múltiplas descrições de uma vez) para otimizar chamadas
- Quando confiança é baixa, retorna uma `question` para o usuário confirmar

### Fluxo no Fechamento de Caixa

1. Ao aprovar o fechamento, antes de inserir as despesas, chama `finance-categorize` com todas as descrições das despesas + nomes que parecem funcionários
2. IA identifica: "Rafael" → funcionário Rafael → categoria "Folha de Pagamento > Salários"; "Moto" → categoria "Taxas Operacionais > App Delivery"
3. Transações são inseridas já categorizadas
4. Se houver dúvidas da IA, exibe um dialog rápido de confirmação antes de finalizar

### Fluxo no Receipt OCR

O `ReceiptOCRSheet` já sugere categoria por nome. Com a nova function, faz match exato com IDs reais das categorias/fornecedores do usuário, eliminando o fuzzy matching atual.

### Cache Inteligente

O hook `useFinanceCategorize` mantém um mapa local `Map<string, CategorizeResult>` que persiste no `localStorage` por sessão. Descrições já categorizadas não chamam a IA novamente, tornando o sistema progressivamente mais rápido.

### Detalhes Técnicos

- **Modelo**: `google/gemini-2.5-flash` (rápido, barato, bom para classificação)
- **Batch**: Até 20 descrições por chamada para reduzir latência
- **Fallback**: Se a IA falhar, mantém `category_id: null` (comportamento atual) sem bloquear o fluxo
- **Segurança**: JWT validado na edge function, dados do usuário isolados

