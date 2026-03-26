

# Ficha Cadastral da Empresa no Módulo de Obrigações

## O que será feito

Criar uma seção "Ficha Cadastral" dentro do módulo de Compliance (Obrigações Legais) que armazena todos os dados e documentos da empresa frequentemente solicitados por fornecedores, contadores, etc. O usuário poderá preencher os dados, fazer upload de documentos e exportar tudo de forma rápida (PDF ou compartilhar).

## Dados da Ficha

- **CNPJ**
- **Inscrição Estadual**
- **Inscrição Municipal**
- **Razão Social**
- **Nome Fantasia**
- **Endereço completo**
- **E-mail da empresa**
- **Telefone**
- **Responsável legal / Sócio**
- **CPF do responsável**

**Documentos (upload de arquivos):**
- Contrato Social / Última alteração
- Cartão CNPJ
- Foto da fachada
- Comprovante de endereço
- RG/CPF do sócio
- Alvará de funcionamento
- Outros documentos customizáveis

## Interface

1. **Aba/botão "Ficha Cadastral"** no topo da página de Compliance (ao lado do progresso), com ícone de Building2 ou FileText
2. Ao clicar, abre um **Sheet fullscreen** com:
   - Seção de dados textuais (formulário com os campos acima)
   - Seção de documentos (lista de uploads com preview de thumbnail)
   - Botão **"Exportar Ficha"** que gera um PDF com todos os dados + links para download dos documentos
   - Botão **"Compartilhar"** que copia os dados ou envia via WhatsApp

## Implementação Técnica

### 1. Banco de dados (migração)
- Adicionar campos na coluna `store_info` (JSON) da tabela `units` — campos como `cnpj`, `inscricao_estadual`, `inscricao_municipal`, `razao_social`, `responsavel_legal`, `cpf_responsavel`, `company_email`, `company_phone`, `company_address`
- Criar tabela `company_documents` para os uploads:
  - `id`, `unit_id`, `name` (ex: "Contrato Social"), `file_url`, `file_type`, `uploaded_at`, `uploaded_by`
- Criar bucket de storage `company-documents` para os arquivos

### 2. Novos componentes
- `src/components/compliance/CompanyProfileSheet.tsx` — Sheet com formulário de dados + seção de documentos
- `src/components/compliance/CompanyDocumentUpload.tsx` — Componente de upload e listagem de documentos
- `src/hooks/useCompanyProfile.ts` — Hook para ler/salvar dados do `store_info` e documentos

### 3. Exportação
- Função que gera texto formatado com todos os dados para copiar/compartilhar
- Botão de copiar e botão de compartilhar via WhatsApp (mesma lógica já usada em pedidos)

### 4. Integração na página
- Adicionar ícone no header da página Compliance que abre o `CompanyProfileSheet`

### 5. Arquivos editados/criados
- **Criar**: `src/components/compliance/CompanyProfileSheet.tsx`
- **Criar**: `src/components/compliance/CompanyDocumentUpload.tsx`
- **Criar**: `src/hooks/useCompanyProfile.ts`
- **Editar**: `src/pages/Compliance.tsx` (adicionar botão no header)
- **Migração**: tabela `company_documents`, bucket `company-documents`, RLS policies

