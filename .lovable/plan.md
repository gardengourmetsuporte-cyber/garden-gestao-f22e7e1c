
# Plano de Implementacao - Sistema de Gestao Completo

## Resumo das Funcionalidades a Implementar

1. **Centro de Configuracoes Unificado** - Um lugar unico para gerenciar categorias, fornecedores, checklists e perfis
2. **Edicao de Perfil** - Informacoes de cargo, foto, etc.
3. **Modulo de Escala de Servico** - Funcionarios escolhem dias de folga
4. **Integracao WhatsApp** - Garantir que pedidos sejam enviados corretamente
5. **Gestao completa de Checklists** - Configurar setores, subcategorias e itens

---

## Fase 1: Estrutura do Banco de Dados

### Novas Tabelas

**1. Extensao da tabela `profiles`:**
```text
+------------------+
|     profiles     |
+------------------+
| + job_title      |
| + department     |
+------------------+
```

**2. Nova tabela `work_schedules`:**
```text
+------------------+
|  work_schedules  |
+------------------+
| id               |
| user_id          |
| month            |
| year             |
| day_off          |
| status           |
| approved_by      |
| created_at       |
+------------------+
```

### RLS (Row Level Security)
- Funcionarios podem ver/editar apenas suas proprias escalas
- Administradores podem ver/aprovar todas as escalas

---

## Fase 2: Centro de Configuracoes Unificado

### Nova Estrutura de Navegacao

A pagina `/settings` sera reorganizada com abas:

```text
+----------------------------------------------+
|              CONFIGURACOES                   |
+----------------------------------------------+
| [Perfil] [Categorias] [Fornecedores]        |
| [Checklists] [Usuarios]                      |
+----------------------------------------------+
```

### Componentes a Criar

1. **ProfileSettings.tsx** - Edicao do proprio perfil
   - Nome completo
   - Cargo
   - Departamento
   - Foto (opcional)

2. **CategorySettings.tsx** - Gestao de categorias de estoque
   - Ja existe parcialmente, sera extraido

3. **SupplierSettings.tsx** - Gestao de fornecedores
   - Nome, Telefone/WhatsApp, Email
   - Ja existe parcialmente, sera extraido

4. **ChecklistSettingsManager.tsx** - Gestao de setores e itens
   - Reutilizar ChecklistSettings existente

5. **UserManagement.tsx** (Admin) - Ver usuarios e alterar roles
   - Lista de usuarios
   - Alterar entre Admin/Funcionario

---

## Fase 3: Modulo de Escala de Servico

### Nova Rota
- `/schedule` - Pagina de escala de trabalho

### Funcionalidades

**Para Funcionarios:**
- Ver calendario do mes
- Selecionar dia de folga desejado
- Ver status da solicitacao (pendente/aprovada/recusada)

**Para Administradores:**
- Ver todas as solicitacoes
- Aprovar ou recusar folgas
- Visualizar calendario geral da equipe

### Componentes a Criar

1. **ScheduleCalendar.tsx** - Calendario visual do mes
2. **DayOffRequest.tsx** - Formulario de solicitacao
3. **ScheduleApproval.tsx** - Lista de aprovacoes (Admin)
4. **TeamScheduleView.tsx** - Visao geral da equipe (Admin)

---

## Fase 4: WhatsApp - Pedidos para Fornecedores

### Validacoes Necessarias

O codigo atual ja possui a funcionalidade de WhatsApp em `OrdersTab.tsx`, mas precisa de:

1. **Validacao de telefone** - Garantir formato correto
2. **Feedback visual** - Mostrar quando fornecedor nao tem WhatsApp
3. **Melhor formatacao da mensagem** - Incluir nome da empresa

### Fluxo do WhatsApp
```text
[Criar Pedido] -> [Adicionar Itens] -> [Enviar WhatsApp]
                                            |
                                            v
                                    wa.me/55XXXXXXXXXXX
                                    ?text=*Pedido*...
```

---

## Fase 5: Atualizacao da Navegacao

### Novo Menu Lateral

```text
+---------------------------+
|    [Logo] Gestao          |
+---------------------------+
|  [User Info]              |
+---------------------------+
|  * Estoque                |
|  * Checklists             |
|  * Escala                 | <- NOVO
|  * Configuracoes (Admin)  |
+---------------------------+
|  [Sair]                   |
+---------------------------+
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Schedule.tsx` | Pagina principal de escala |
| `src/hooks/useSchedule.ts` | Hook para gerenciar escalas |
| `src/hooks/useUsers.ts` | Hook para listar usuarios (Admin) |
| `src/components/settings/ProfileSettings.tsx` | Edicao de perfil |
| `src/components/settings/CategorySettings.tsx` | Gestao de categorias |
| `src/components/settings/SupplierSettings.tsx` | Gestao de fornecedores |
| `src/components/settings/UserManagement.tsx` | Gestao de usuarios |
| `src/components/schedule/ScheduleCalendar.tsx` | Calendario de escala |
| `src/components/schedule/DayOffRequest.tsx` | Solicitacao de folga |
| `src/components/schedule/ScheduleApproval.tsx` | Aprovacao de folgas |

### Arquivos a Modificar
| Arquivo | Alteracoes |
|---------|------------|
| `src/App.tsx` | Adicionar rota `/schedule` |
| `src/components/layout/AppLayout.tsx` | Adicionar menu Escala |
| `src/pages/Settings.tsx` | Reorganizar com abas |
| `src/types/database.ts` | Adicionar tipos de escala |
| `src/components/inventory/OrdersTab.tsx` | Melhorar validacao WhatsApp |

---

## Migracao do Banco de Dados

```sql
-- 1. Adicionar campos ao perfil
ALTER TABLE profiles
ADD COLUMN job_title TEXT,
ADD COLUMN department TEXT;

-- 2. Criar tabela de escalas
CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  day_off INTEGER NOT NULL CHECK (day_off >= 1 AND day_off <= 31),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- 3. RLS para escalas
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- Funcionarios veem suas proprias escalas
CREATE POLICY "Users can view own schedules"
ON work_schedules FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Funcionarios podem criar suas escalas
CREATE POLICY "Users can create own schedules"
ON work_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Funcionarios podem atualizar escalas pendentes
CREATE POLICY "Users can update pending schedules"
ON work_schedules FOR UPDATE
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR has_role(auth.uid(), 'admin')
);

-- Admins podem deletar
CREATE POLICY "Admins can delete schedules"
ON work_schedules FOR DELETE
USING (has_role(auth.uid(), 'admin'));
```

---

## Ordem de Implementacao

1. **Migracao do banco** - Adicionar novos campos e tabela de escalas
2. **Tipos TypeScript** - Atualizar `database.ts`
3. **Hooks** - Criar `useSchedule.ts` e `useUsers.ts`
4. **Componentes de Configuracoes** - Separar em componentes menores
5. **Pagina Settings** - Reorganizar com abas
6. **Modulo de Escala** - Criar pagina e componentes
7. **Navegacao** - Adicionar novo item no menu
8. **WhatsApp** - Melhorar validacoes e feedback
9. **Testes** - Verificar fluxos completos

---

## Detalhes Tecnicos

### Estrutura de Abas em Settings

```tsx
// Settings.tsx
<Tabs defaultValue="profile">
  <TabsList>
    <TabsTrigger value="profile">Perfil</TabsTrigger>
    <TabsTrigger value="categories">Categorias</TabsTrigger>
    <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
    <TabsTrigger value="checklists">Checklists</TabsTrigger>
    {isAdmin && <TabsTrigger value="users">Usuarios</TabsTrigger>}
  </TabsList>
  
  <TabsContent value="profile">
    <ProfileSettings />
  </TabsContent>
  {/* ... outras abas */}
</Tabs>
```

### Calendario de Escala

Utilizaremos o componente `Calendar` existente do shadcn/ui com customizacoes para:
- Destacar dias de folga aprovados
- Mostrar solicitacoes pendentes
- Permitir selecao de dia

### Validacao de WhatsApp

```tsx
const formatPhoneForWhatsApp = (phone: string) => {
  // Remove caracteres nao numericos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se nao comecar com 55, adiciona
  if (!cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  return cleaned;
};

const hasValidWhatsApp = (supplier: Supplier) => {
  return supplier.phone && supplier.phone.replace(/\D/g, '').length >= 10;
};
```

---

## Resultado Final

Apos a implementacao, o sistema tera:

- Centro unificado de configuracoes com abas organizadas
- Edicao de perfil com cargo e departamento
- Modulo de escala para funcionarios escolherem folgas
- Aprovacao de folgas pelo administrador
- WhatsApp funcional com validacoes
- Gestao completa de categorias, fornecedores e checklists
- Interface moderna e profissional
