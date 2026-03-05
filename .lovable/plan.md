

## Plano: Importacao de Ponto + Sistema de Atestados com Upload de Foto

### Resumo

Criar 3 funcionalidades no modulo de Ponto:

1. **Importacao de registros de ponto** via arquivo XLS/CSV (admin)
2. **Registro de atestados medicos** com upload de foto (camera/galeria nativo)
3. **Registro de ausencias** (folga, falta, atestado) com documentacao

---

### 1. Migracao de Banco de Dados

**Nova tabela `medical_certificates`:**
- `id`, `user_id`, `unit_id`, `date_start`, `date_end`, `days_count`
- `document_url` (foto do atestado no Storage)
- `notes`, `status` (pending/approved/rejected), `reviewed_by`
- `created_at`

**Novo bucket de Storage:** `medical-certificates` (privado, com RLS)

**Coluna adicional em `time_records`:** `certificate_id uuid` (FK opcional para `medical_certificates`)

---

### 2. Importacao de Ponto (Admin)

- Botao "Importar Ponto" na tela de TimeTracking (admin only)
- Abre Sheet com upload de arquivo (.xls, .csv)
- **Edge Function `import-time-records`**: recebe JSON estruturado, faz matching por nome de funcionario (`employees.full_name`), upsert em `time_records`
- Client-side: parsing com `document--parse_document` para XLS, preview antes de confirmar
- Mapeamento: FOLGA → `day_off`, ATESTADO → `day_off` + nota, FALTA → `absent`, horarios → `check_in`/`check_out`

---

### 3. Sistema de Atestados

- Funcionario: botao "Enviar Atestado" na tela de Ponto
- Abre Sheet com:
  - Periodo (data inicio/fim)
  - Upload de foto: usa `<input type="file" accept="image/*" capture="environment">` para acesso nativo a camera/galeria
  - Observacoes
- Upload da imagem para bucket `medical-certificates`
- Cria registro em `medical_certificates` + registros `day_off` em `time_records` para cada dia do periodo

- Admin: visualiza atestados pendentes, pode aprovar/rejeitar, ve a foto do documento

---

### 4. Registro Rapido de Ausencias (Admin)

- No formulario de Lancamento Manual, adicionar opcao de tipo: `Ponto Normal`, `Folga`, `Falta`, `Atestado`
- Ao selecionar Folga/Falta: nao exige horarios de entrada/saida
- Ao selecionar Atestado: exibe campo de upload de foto

---

### Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| Nova migracao SQL | Tabela `medical_certificates`, bucket storage, RLS |
| `src/hooks/useTimeTracking.ts` | Funcoes de importacao e atestados |
| `src/components/employees/TimeTracking.tsx` | Botoes importar/atestado, Sheet de atestado, Sheet de importacao |
| Nova edge function `import-time-records` | Parsing e upsert em batch |
| Novo hook `useMedicalCertificates.ts` | CRUD de atestados com upload |

