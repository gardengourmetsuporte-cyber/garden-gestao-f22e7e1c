

# Plano: Exigir PIN de admin para excluir conta

## Contexto
Atualmente, ao excluir uma conta no TeamHub ou UserManagement, basta confirmar no AlertDialog. O pedido é adicionar uma etapa de validação por PIN de administrador (o `quick_pin` de 4 dígitos já cadastrado nos funcionários) antes de permitir a exclusão.

## Alterações

### 1. Criar componente `AdminPinDialog`
- Novo componente reutilizável em `src/components/ui/AdminPinDialog.tsx`
- Input de 4 dígitos numéricos com visual de PIN (estilo OTP)
- Ao confirmar, valida o PIN contra a tabela `employees` (busca por `quick_pin` na unidade ativa, onde o funcionário tem role owner/admin)
- Exibe erro se PIN inválido; chama callback `onAuthorized()` se válido
- Reutiliza o mesmo padrão de `validatePinWithPermission` do `usePOS.ts`

### 2. Atualizar `TeamHub.tsx`
- Ao clicar "Excluir permanentemente" no AlertDialog, em vez de chamar `handleDeleteAccount` diretamente, abre o `AdminPinDialog`
- Só executa a exclusão após PIN validado com sucesso

### 3. Atualizar `UserManagement.tsx`
- Mesma lógica: AlertDialog de exclusão abre o `AdminPinDialog` antes de executar

### Fluxo
```text
Clicar "Excluir conta" → AlertDialog confirma intenção
  → Clicar "Excluir permanentemente" → Abre AdminPinDialog
  → Digitar PIN 4 dígitos → Valida contra employees (owner/admin)
  → PIN correto → Executa delete_account
  → PIN errado → Mostra erro, tenta novamente
```

