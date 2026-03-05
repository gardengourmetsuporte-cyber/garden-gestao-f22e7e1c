

## Plano: Sistema de Advertencias Trabalhistas (CLT)

### Contexto Legal (CLT)

O sistema seguira a progressao disciplinar prevista na legislacao brasileira:
1. **Advertencia Verbal** - registro informal, primeira ocorrencia
2. **Advertencia Escrita** - documento formal, reincidencia
3. **Suspensao** (1 a 30 dias) - falta grave ou reincidencia de advertencias
4. **Demissao por Justa Causa** (Art. 482 CLT) - ultimo recurso

Motivos tipificados no Art. 482 da CLT: ato de improbidade, incontinencia de conduta, negociacao habitual, condenacao criminal, desidia, embriaguez, violacao de segredo, indisciplina, insubordinacao, abandono de emprego, ato lesivo da honra, pratica de jogos de azar, perda de habilitacao profissional.

---

### 1. Migracao de Banco de Dados

**Nova tabela `employee_warnings`:**
- `id`, `employee_id` (FK employees), `unit_id` (FK units)
- `type`: enum `verbal`, `written`, `suspension`, `dismissal`
- `severity`: enum `light`, `moderate`, `serious`
- `reason`: text (motivo livre)
- `legal_basis`: text (artigo CLT, ex: "Art. 482, alínea e - Desídia")
- `description`: text (descricao detalhada do ocorrido)
- `date`: date (data da ocorrencia)
- `suspension_days`: integer (dias de suspensao, se aplicavel)
- `witness_1`, `witness_2`: text (nomes das testemunhas)
- `document_url`: text (foto/scan do documento assinado)
- `employee_acknowledged`: boolean (funcionario tomou ciencia)
- `acknowledged_at`: timestamptz
- `issued_by`: uuid (admin que aplicou)
- `notes`: text
- `created_at`, `updated_at`

RLS: admins da unidade podem CRUD, funcionario ve apenas as proprias.

---

### 2. Hook `useEmployeeWarnings.ts`

- Fetch warnings por employee ou por unidade
- Criar advertencia com upload de documento
- Marcar ciencia do funcionario
- Contar advertencias por tipo para exibir historico progressivo

---

### 3. Componente `EmployeeWarnings.tsx`

**Visao Admin:**
- Nova aba "Advertencias" na pagina de Funcionarios (icon: AlertTriangle, cor vermelha)
- Listagem de advertencias com filtro por funcionario e tipo
- Botao "Nova Advertencia" abre Sheet com:
  - Selecao do funcionario
  - Tipo (Verbal / Escrita / Suspensao / Justa Causa)
  - Gravidade (Leve / Moderada / Grave)
  - Motivo com sugestoes baseadas no Art. 482 CLT
  - Data da ocorrencia
  - Dias de suspensao (quando tipo = suspensao)
  - Testemunhas (2 campos)
  - Upload de documento (foto da advertencia assinada)
  - Descricao detalhada
- Card de advertencia mostra: tipo (badge colorido), data, motivo, status de ciencia
- Indicador de progressao: quantas advertencias o funcionario ja tem

**Visao Funcionario:**
- Pode ver suas proprias advertencias na aba
- Botao "Ciente" para registrar ciencia digital

---

### 4. Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| Nova migracao SQL | Tabela `employee_warnings` + RLS |
| `src/hooks/useEmployeeWarnings.ts` | Novo hook CRUD |
| `src/components/employees/EmployeeWarnings.tsx` | Novo componente |
| `src/pages/Employees.tsx` | Nova aba "Advertencias" |
| `src/types/employee.ts` | Tipos de advertencia |

