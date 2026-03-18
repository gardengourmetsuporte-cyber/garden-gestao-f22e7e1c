

## Cadastro de Freelancer com IA (Foto do Contato ou Currículo)

### Objetivo
Adicionar ao formulário de Novo Freelancer a opção de tirar foto de um contato (print da tela de contato do celular) ou de um currículo, e usar IA para extrair automaticamente nome, telefone, setor e observações, preenchendo o formulário.

### Implementação

**1. Nova Edge Function `freelancer-ocr`**
- Recebe `image_base64` (foto do contato ou currículo)
- Usa Lovable AI Gateway (`google/gemini-2.5-flash`) com prompt específico para extrair:
  - `name`, `phone`, `sector` (mapear para cozinha/salao/entregador/bar/outros), `notes` (experiência, habilidades)
- Retorna JSON estruturado via tool calling
- Segue o mesmo padrão de autenticação do `document-scanner`

**2. Atualizar `FreelancerSheet.tsx`**
- Adicionar dois botões no topo do formulário (antes dos campos): "Câmera" e "Galeria"
- Ao capturar/selecionar imagem → converte para base64 → chama edge function
- Mostra loading spinner durante processamento
- Preenche os campos do formulário com `setValue()` usando os dados extraídos
- Reutiliza `InBrowserCamera` para captura e `takeNativePhoto` para iOS
- Usuário pode revisar e ajustar antes de salvar

**3. Fluxo do usuário**
- Abre "Novo Freelancer" → clica no ícone de câmera/galeria
- Tira foto do contato salvo no celular ou de um currículo impresso
- IA extrai os dados → campos preenchidos automaticamente
- Usuário revisa, ajusta se necessário, e clica "Cadastrar"

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/freelancer-ocr/index.ts` |
| Editar | `src/components/freelancers/FreelancerSheet.tsx` |

