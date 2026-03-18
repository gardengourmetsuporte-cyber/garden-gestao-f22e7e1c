
Objetivo: deixar as sugestões realmente úteis, mostrando apenas contas fixas reais e assinaturas reais (ex.: Colibri, Goomer), removendo ruído de fornecedor/funcionário.

1) Diagnóstico confirmado (com dados reais do backend)
- Hoje a função `detect-recurring` aceita quase tudo que repete em 2+ meses, sem filtrar vínculo de fornecedor/funcionário.
- Resultado atual inclui nomes de pessoas e fornecedores (ex.: Bruno, Gabriel, Mega G, Catupiry), que não deveriam virar assinatura/conta fixa.
- O recorte de 180 dias faz a IA perder casos reais como Colibri (tem histórico recorrente, mas uma ocorrência ficou fora da janela).
- A lista “known services” do backend está incompleta para o contexto do restaurante (ex.: Colibri/Goomer).

2) Mudanças de implementação (sem alterar banco)
Arquivo principal: `supabase/functions/detect-recurring/index.ts`

2.1) Melhorar coleta e contexto
- Buscar transações não deletadas (`deleted_at is null`) e incluir `supplier_id`, `employee_id`.
- Expandir janela de não-fixos de 180 para 365 dias (ou 12 meses) para capturar recorrências reais mais espaçadas.

2.2) Pré-filtro inteligente (antes da IA)
- Excluir automaticamente grupos com:
  - qualquer `supplier_id` presente
  - qualquer `employee_id` presente
- Excluir por sinais de operação variável (não assinatura), com regras defensivas:
  - descrições com padrão de taxa/tarifa percentual (ex.: “taxa … %”)
  - alta frequência no mesmo mês (indicador de gasto operacional, não mensalidade)
- Manter elegíveis:
  - serviços conhecidos
  - itens marcados como fixos
  - recorrência temporal consistente (2+ meses com padrão plausível)

2.3) Normalização de descrição mais robusta
- Fortalecer normalização para unificar variações:
  - caixa baixa, espaços extras
  - sufixos de parcela `(n/12)` e variações equivalentes
- Isso evita duplicatas e melhora agrupamento correto (ex.: “Goomer”, “Goomer (3/12)”).

2.4) Fortalecer classificação da IA
- Atualizar prompt com regra explícita:
  - “NUNCA classificar como assinatura/conta fixa quando for fornecedor/funcionário”
- Passar contexto resumido da candidatura (ex.: `has_supplier`, `has_employee`, frequência mensal, variabilidade de valor).
- Só aceitar classificação da IA quando bater com as regras de elegibilidade; caso contrário, descartar item.

2.5) Expandir dicionário de serviços conhecidos
- Incluir no backend (`KNOWN_SERVICES` da função):
  - `colibri` → assinatura (software)
  - `goomer` → assinatura (software/app delivery)
- (Opcional de consistência) refletir os mesmos serviços em `src/lib/knownServices.ts` para autocomplete/manual.

2.6) Ranking final mais útil
- Prioridade:
  1) known services (Colibri/Goomer etc.)
  2) fixos reais com padrão mensal
  3) demais recorrências com boa confiança
- Reduzir saída para itens de alta qualidade (menos volume, mais precisão), para que os importantes apareçam no topo.

3) Critérios de aceite
- Não devem mais aparecer sugestões como nomes de funcionários e fornecedores.
- Devem aparecer sugestões reais como Goomer e Colibri quando houver histórico mínimo.
- As abas de Assinaturas/Contas continuam recebendo itens já classificados com opção de editar antes de adicionar.

4) Validação após implementação
- Teste direto da função com `unit_id` (via chamada de função) e revisar payload:
  - Esperado: Colibri/Goomer presentes.
  - Esperado: Bruno/Gabriel/Mega G/Catupiry ausentes.
- Verificação no app `/subscriptions`:
  - sugestões separadas por aba corretas
  - fluxo “Editar antes de adicionar” intacto
  - botão de adicionar/cancelar continua funcionando.
