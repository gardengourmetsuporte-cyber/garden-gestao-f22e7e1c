
# Sistema de Estado de Conclusao por Modulo

## Visao Geral

Criar um sistema de indicadores visuais na barra lateral que mostra automaticamente o estado de cada modulo (Concluido, Atencao, Critico) baseado em regras de negocios internas. Nenhum banco de dados novo e necessario -- toda a logica e derivada dos dados ja existentes.

---

## Arquitetura

O sistema **nao precisa de tabelas novas**. Os estados sao calculados em tempo real a partir dos dados ja existentes no banco via um hook centralizado (`useModuleStatus`), que reutiliza e estende o `useDashboardStats` existente.

---

## Regras de Status por Modulo

| Modulo | Critico (vermelho) | Atencao (amarelo) | Concluido (verde) |
|---|---|---|---|
| **Financeiro** | Transacoes vencidas nao pagas (data < hoje) | Transacoes do dia nao pagas | Tudo conciliado no mes |
| **Estoque** | Itens com estoque zerado | Itens abaixo do minimo | Todos os itens acima do minimo |
| **Checklists** | -- | Checklist do turno atual incompleto | Checklist do turno completo |
| **Fechamento** | -- | Fechamentos pendentes de validacao (admin) | Todos validados |
| **Funcionarios** | -- | Pagamentos do mes em aberto | Todos pagos |
| **Recompensas** | -- | Resgates pendentes de aprovacao (admin) | Todos processados |

Modulos sem regras definidas (Dashboard, Agenda, Chat, Receitas, Cardapio, WhatsApp, Configuracoes) nao exibem indicador.

---

## Implementacao Tecnica

### 1. Novo hook: `useModuleStatus`

Hook centralizado que calcula o estado de cada modulo usando uma unica query paralela (estendendo o padrao do `useDashboardStats`).

Retorna um mapa:
```text
{
  '/finance':     { level: 'critical', count: 3, tooltip: '3 despesas vencidas' },
  '/inventory':   { level: 'attention', count: 2, tooltip: '2 itens abaixo do minimo' },
  '/checklists':  { level: 'ok', count: 0, tooltip: 'Checklists em dia' },
  '/cash-closing': { level: 'attention', count: 1, tooltip: '1 fechamento pendente' },
  ...
}
```

Niveis: `'ok'` | `'attention'` | `'critical'` | `null` (sem indicador)

Usa React Query com `staleTime: 2min` (mesmo padrao global) e queryKey vinculada ao `activeUnitId` para isolamento multi-tenant.

### 2. Consultas do hook

O hook executa em paralelo (Promise.all):

- **Financeiro**: Conta transacoes nao pagas do mes atual, separando vencidas (data < hoje) das do dia
- **Estoque**: Conta itens com `current_stock = 0` (critico) e `current_stock <= min_stock` (atencao)
- **Checklists**: Conta itens do turno atual (abertura/fechamento baseado no horario) nao completados hoje
- **Fechamento**: Conta fechamentos com `status = 'pending'`
- **Funcionarios**: Conta pagamentos do mes com `is_paid = false`
- **Recompensas**: Conta resgates com `status = 'pending'`

### 3. Modificacao no `AppLayout.tsx`

Na renderizacao de cada item do menu lateral, adicionar um indicador visual condicional:

- **Dot colorido** ao lado direito do label do modulo (substituindo o chevron quando ha pendencia)
- **Cores**:
  - Critico: vermelho com glow sutil (`hsl(var(--neon-red))`)
  - Atencao: amarelo/amber com glow sutil (`hsl(var(--neon-amber))`)
  - Concluido: verde com glow sutil (`hsl(var(--neon-green))`) -- exibido apenas brevemente ou por opcao
- **Badge numerico** mostrando a contagem de pendencias (mesmo estilo dos badges de notificacao existentes)
- **Tooltip nativo** (atributo `title`) com a explicacao do estado

O indicador aparece como um pequeno dot (6x6px) com animacao `pulse` suave no caso critico, e um badge de contagem discreto.

### 4. Estilo visual

Seguindo a estetica "Dark Command Center" existente:

- Dot de status: circulo de 6px com `box-shadow` de glow na cor correspondente
- Badge de contagem: mesmo estilo dos badges existentes de notificacao/chat (compacto, 16x16px, font 8px)
- Animacao de pulso sutil apenas para estado critico (reutiliza `animate-pulse` existente)
- Sem elementos infantis, gamificacao ou icones extras -- apenas indicadores minimalistas

---

## Arquivos que serao criados/modificados

| Arquivo | Descricao |
|---|---|
| `src/hooks/useModuleStatus.ts` | **Novo** - Hook centralizado com logica de status |
| `src/components/layout/AppLayout.tsx` | Adicionar indicadores visuais nos itens do menu |

Nenhuma migracao de banco de dados e necessaria.

---

## Secao Tecnica

### Estrutura do hook

```text
useModuleStatus()
  ├── Inputs: user.id, activeUnitId, isAdmin
  ├── Query: Promise.all(6 consultas Supabase)
  ├── Processamento: regras de negocio por modulo
  └── Output: Record<string, { level, count, tooltip } | null>
```

### Logica de prioridade

Quando um modulo tem tanto itens criticos quanto de atencao, o nivel exibido e o mais grave (critico > atencao > ok). A contagem reflete o total de pendencias (soma de ambos).

### Performance

- Reutiliza o padrao de cache do `useDashboardStats` (staleTime 2min)
- Consultas usam `count: 'exact', head: true` sempre que possivel para minimizar transferencia de dados
- Executado apenas para admins (funcionarios nao veem todos os modulos)
