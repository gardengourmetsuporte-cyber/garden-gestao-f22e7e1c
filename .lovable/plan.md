

# Plano de Implementação: Agenda do Gestor + IA no Dashboard

## Resumo

Implementar o módulo completo de Agenda exclusivo para administradores e adicionar um card de interação com IA no Dashboard principal.

## O Que Será Construído

### 1. Módulo Agenda do Gestor
- Página `/agenda` visível apenas para admins
- Tarefas organizadas por período (Manhã/Tarde/Noite)
- Compromissos com horário fixo
- Tarefas automáticas vindas do estoque e checklists
- Sugestões de IA para gestão do dia

### 2. Card de IA no Dashboard
- Seção "Assistente de Gestão" no Dashboard admin
- Input para perguntas rápidas
- Respostas contextuais baseadas nos dados do sistema
- Sugestões inteligentes diárias

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabelas `manager_tasks` e `manager_appointments` |
| `supabase/functions/management-ai/index.ts` | Edge function para IA |
| `src/types/database.ts` | Adicionar tipos da agenda |
| `src/hooks/useAgenda.ts` | Hook principal do módulo |
| `src/pages/Agenda.tsx` | Página da agenda |
| `src/components/agenda/AgendaDayView.tsx` | Visualização do dia |
| `src/components/agenda/TaskItem.tsx` | Item de tarefa |
| `src/components/agenda/AppointmentItem.tsx` | Item de compromisso |
| `src/components/agenda/TaskSheet.tsx` | Sheet para criar tarefa |
| `src/components/agenda/AppointmentSheet.tsx` | Sheet para compromisso |
| `src/components/agenda/SystemAlerts.tsx` | Alertas automáticos |
| `src/components/agenda/AISuggestions.tsx` | Sugestões de IA |
| `src/components/dashboard/AIAssistant.tsx` | Card IA no Dashboard |
| `src/components/layout/AppLayout.tsx` | Adicionar link Agenda |
| `src/App.tsx` | Adicionar rota `/agenda` |

## Estrutura do Banco de Dados

```text
manager_tasks
├── id (uuid)
├── user_id (uuid) → auth.users
├── title (text)
├── period (enum: morning/afternoon/evening)
├── priority (enum: low/medium/high)
├── is_completed (boolean)
├── is_system_generated (boolean)
├── system_source (text, nullable)
├── source_data (jsonb, nullable)
├── date (date)
└── timestamps

manager_appointments
├── id (uuid)
├── user_id (uuid) → auth.users
├── title (text)
├── scheduled_time (time)
├── notes (text, nullable)
├── date (date)
└── timestamps
```

## Visual do Dashboard com IA

```text
┌────────────────────────────────────────────────────────────┐
│  🤖 Assistente de Gestão                                   │
│                                                            │
│  "Bom dia! Você tem 3 itens de estoque crítico e 2        │
│   resgates pendentes. Considere revisar o estoque         │
│   de laticínios antes do almoço."                         │
│                                                            │
│  ┌──────────────────────────────────────────────┐  ┌────┐ │
│  │ Pergunte algo sobre sua operação...          │  │ ➤  │ │
│  └──────────────────────────────────────────────┘  └────┘ │
│                                                            │
│  Sugestões rápidas:                                        │
│  [Como está meu estoque?] [Resumo do dia] [Prioridades]   │
└────────────────────────────────────────────────────────────┘
```

## Ordem de Execução

1. Migração do banco (tabelas + enums + RLS)
2. Atualizar tipos TypeScript
3. Edge function para IA
4. Hook useAgenda
5. Componentes da Agenda
6. Página Agenda
7. Componente AIAssistant para Dashboard
8. Integrar no AdminDashboard
9. Atualizar navegação e rotas

## Resultado Esperado

- Novo módulo Agenda visível apenas para admins
- Tarefas por período do dia (Manhã/Tarde/Noite)
- Compromissos com horário
- Tarefas automáticas do sistema (não apagáveis)
- Sugestões de IA no final da agenda
- Card de IA interativo no Dashboard principal
- Perguntas e respostas sobre a operação
- Mobile-first com interface limpa

