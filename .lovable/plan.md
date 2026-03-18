

# Autocomplete de Serviços com Links Pré-definidos

## Problema
O campo "Nome" é texto livre e o "Link de gerenciamento" precisa ser buscado manualmente — inviável para o usuário.

## Solução
Adicionar um catálogo de serviços populares (50+) com nome, categoria, URL de gerenciamento e ciclo padrão. Ao digitar no campo Nome, uma lista de sugestões aparece (autocomplete). Ao selecionar um serviço, os campos são preenchidos automaticamente.

## Implementação

### 1. Catálogo de serviços (`src/lib/knownServices.ts`)
Array de objetos com serviços populares no Brasil:

```text
{ name, category, defaultCycle, managementUrl, icon? }
```

Exemplos: Netflix, Spotify, Disney+, Amazon Prime, iCloud, Google One, Adobe, Canva, ChatGPT, Lovable, GitHub, AWS, Azure, Nubank, iFood, Uber, 99, Claro, Vivo, Tim, Oi, CPFL, Sabesp, Enel, Unimed, SmartFit, etc.

### 2. Modificar `SubscriptionSheet.tsx`
- Substituir o Input de "Nome" por um campo com dropdown de sugestões (combobox-like)
- Ao digitar, filtrar o catálogo e mostrar até 6 sugestões abaixo do input
- Ao clicar numa sugestão: preencher automaticamente `name`, `category`, `billingCycle`, `managementUrl`
- Permitir continuar digitando nome customizado (não obrigar a usar o catálogo)
- O campo "Link de gerenciamento" continua editável mas já vem preenchido

### 3. UX do Autocomplete
- Lista suspensa com nome do serviço e categoria como badge
- Se o usuário digitar algo que não está no catálogo, pode criar livremente
- Visual consistente com o design system existente (dark, cards, etc.)

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/lib/knownServices.ts` — catálogo de ~50 serviços |
| Editar | `src/components/subscriptions/SubscriptionSheet.tsx` — autocomplete no nome |

