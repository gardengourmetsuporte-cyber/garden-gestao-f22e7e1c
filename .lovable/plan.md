
# Backup e Restauracao do Financeiro

## Visao Geral

Criar um sistema de snapshots (pontos de restauracao) para o modulo financeiro. Voce podera criar um backup a qualquer momento e, se algo der errado, restaurar os saldos e transacoes para aquele ponto exato.

---

## Como Funciona

1. **Criar Backup**: Botao na aba "Mais" do financeiro. Ao clicar, o sistema salva uma foto completa das suas contas (nomes, saldos) e transacoes do mes atual.
2. **Ver Backups**: Lista com data/hora de cada backup criado, mostrando o saldo total naquele momento.
3. **Comparar**: Ao abrir um backup, voce ve lado a lado o saldo de cada conta no backup vs. o saldo atual, destacando diferencas.
4. **Restaurar**: Botao para reverter tudo ao estado do backup -- apaga transacoes novas e recria as que existiam, restaurando saldos.

---

## Estrutura no Banco de Dados

Uma nova tabela `finance_snapshots` para armazenar os backups:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Identificador unico |
| user_id | uuid | Dono do backup |
| unit_id | uuid | Unidade |
| name | text | Nome descritivo (ex: "Antes do ajuste de janeiro") |
| accounts_data | jsonb | Foto das contas (id, nome, saldo) |
| transactions_data | jsonb | Foto de todas as transacoes do periodo |
| total_balance | numeric | Saldo total no momento do backup |
| month | date | Mes de referencia |
| created_at | timestamp | Data/hora da criacao |

Politica RLS: cada usuario so acessa seus proprios backups.

---

## Alteracoes no Sistema

### Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useFinanceBackup.ts` | Hook com funcoes de criar, listar, comparar e restaurar backups |
| `src/components/finance/FinanceBackupSheet.tsx` | Sheet com lista de backups, botao de criar, e opcoes de comparar/restaurar |

### Arquivos Editados

| Arquivo | Descricao |
|---------|-----------|
| `src/components/finance/FinanceMore.tsx` | Adicionar item "Backups" no menu |
| `src/pages/Finance.tsx` | Passar props necessarias para o FinanceMore |

---

## Fluxo do Usuario

1. Vai em **Financeiro > Mais > Backups**
2. Clica em **"Criar Backup Agora"** -- escolhe um nome opcional
3. Backup aparece na lista com data, saldo total e numero de transacoes
4. Para comparar: clica no backup e ve as diferencas de saldo por conta
5. Para restaurar: botao com confirmacao dupla ("Tem certeza? Isso vai substituir os dados atuais")

---

## Seguranca

- Confirmacao dupla antes de restaurar (dialog de alerta)
- Limite de 10 backups por usuario (os mais antigos sao excluidos automaticamente)
- A restauracao cria um backup automatico do estado atual antes de reverter (seguranca extra)
