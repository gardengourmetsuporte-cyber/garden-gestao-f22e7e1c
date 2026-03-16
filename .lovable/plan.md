

# Central de Replicação entre Unidades

## Problema
Hoje a replicação está espalhada: estoque fica em Configurações > Categorias, cardápio tem botão próprio no CardapioHub, e checklist tem o `ChecklistClone` nas configurações de checklist. Não existe replicação para fornecedores nem categorias financeiras. O usuário quer um lugar centralizado para escolher o que replicar.

## Solução
Criar uma nova seção **"Replicar Dados"** nas Configurações (seção "Sistema"), com uma interface unificada onde o usuário seleciona a unidade de origem/destino e marca quais módulos quer copiar.

## Módulos replicáveis

| Módulo | O que copia | Comportamento |
|--------|------------|---------------|
| **Estoque** | Categorias + produtos (sem saldo) | Ignora duplicatas por nome |
| **Fornecedores** | Cadastro de fornecedores | Ignora duplicatas por nome |
| **Checklists** | Setores, subcategorias e itens | Cópia completa |
| **Categorias Financeiras** | Árvore de categorias (receita/despesa) | Ignora duplicatas por nome |
| **Cardápio** | Categorias, grupos e produtos | Substitui tudo na unidade destino |

## Interface

- Select de unidade de origem
- Seta indicando direção (origem → unidade ativa)
- Grid de cards com checkbox para cada módulo (ícone colorido, nome, descrição curta)
- Botão "Replicar Selecionados" com AlertDialog de confirmação
- Resultado com contadores por módulo

## Implementação técnica

1. **Novo componente** `src/components/settings/DataReplication.tsx`
   - Componente centralizado que orquestra toda a replicação
   - Cada módulo tem sua função async de replicação interna
   - Reutiliza lógica já existente dos componentes `InventoryReplication`, `ChecklistClone`, `MenuReplication`

2. **Novo item no menu de Configurações** (`Settings.tsx`)
   - Adicionar `{ value: 'replication', icon: 'Copy', label: 'Replicar Dados', description: 'Copiar dados entre lojas', variant: 'purple', section: 'Sistema', requiredPlan: 'pro' }`
   - Lazy load do `DataReplication`
   - Visível apenas para admins com mais de 1 unidade

3. **Lógica de replicação de fornecedores** (nova)
   - Busca `suppliers` da unidade origem
   - Insere na unidade destino ignorando duplicatas por nome

4. **Lógica de replicação de categorias financeiras** (nova)
   - Busca `finance_categories` da unidade origem (com hierarquia parent_id)
   - Insere na unidade destino mapeando parent_id, ignorando duplicatas por nome+tipo

5. **Remover** `InventoryReplication` do `CategorySettings.tsx` (fica só no hub centralizado)

