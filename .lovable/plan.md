

## Plano: Centralizar Gestão de Usuários com Níveis de Acesso e Convites

### Resumo
Unificar três telas separadas (Usuários, Equipe & Convites, Níveis de Acesso) em uma única seção "Equipe" dentro das Configurações. A seleção de cargo (Admin, Funcionário) passa a ser feita via níveis de acesso customizáveis, e o convite de novos membros fica integrado na mesma tela.

### Estrutura da nova tela "Equipe"

```text
┌─────────────────────────────────────┐
│  [+ Convidar]              Equipe   │
├─────────────────────────────────────┤
│  Tabs: [Membros] [Convites] [Níveis]│
├─────────────────────────────────────┤
│                                     │
│  Tab Membros:                       │
│  ┌─────────────────────────────────┐│
│  │ 👤 João Silva                   ││
│  │    Dono · Acesso completo       ││
│  │              [Nível ▾] [⋮]     ││
│  ├─────────────────────────────────┤│
│  │ 👤 Maria                        ││
│  │    Funcionário · Líder          ││
│  │              [Nível ▾] [⋮]     ││
│  └─────────────────────────────────┘│
│                                     │
│  Tab Convites:                      │
│  (Formulário de convite + lista)    │
│                                     │
│  Tab Níveis:                        │
│  (Criar/editar níveis de acesso)    │
│  Ex: "Líder" → Checklists ✓        │
│       Estoque ✓  Financeiro ✗       │
└─────────────────────────────────────┘
```

### Passos de implementação

1. **Criar componente unificado `TeamHub.tsx`**
   - Componente com 3 tabs (Membros, Convites, Níveis de Acesso)
   - Tab "Membros": lista de usuários da unidade, cada um com botão de nível de acesso (picker inline), botão de ações (senha, transferir, remover, excluir)
   - Tab "Convites": mover lógica do `TeamManagement.tsx` (formulário de email + cargo + lista de pendentes)
   - Tab "Níveis": mover lógica do `AccessLevelSettings.tsx` (criar/editar/excluir níveis com permissões por módulo)

2. **Unificar seleção de cargo + nível de acesso no card do usuário**
   - Substituir o dropdown de role (Admin/Super Admin/Funcionário) por um picker de nível de acesso
   - Os níveis padrão do sistema (Dono, Gerente, Funcionário) vêm pré-configurados com permissões default
   - Níveis customizados (ex: "Líder") aparecem na mesma lista
   - Ao selecionar um nível, atualiza tanto o `user_units.role` quanto o `user_units.access_level_id`

3. **Atualizar `Settings.tsx`**
   - Remover entradas separadas de "Usuários", "Equipe & Convites" e "Níveis de Acesso"
   - Adicionar uma única entrada "Equipe" que renderiza o novo `TeamHub`

4. **Manter hooks existentes**
   - Reutilizar `useUsers`, `useAccessLevels`, e a lógica de convites sem alteração nos hooks
   - Apenas a camada de UI é consolidada

### Detalhes técnicos

- Sem alterações no banco de dados — a estrutura atual de `access_levels`, `user_units`, e `user_roles` suporta o modelo
- O nível de acesso "Acesso completo" continua sendo `access_level_id = null`
- Níveis padrão do sistema (Dono/Gerente/Funcionário) são os roles do `user_units` — mantidos como estão, com a opção de atribuir um nível de acesso adicional para refinar permissões
- O botão de convite no tab "Convites" mantém a mesma lógica de gerar link com compartilhamento via WhatsApp/Email

