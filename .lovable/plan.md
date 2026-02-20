
# IA Executora com n8n - Copiloto que Age no Sistema

## Analise do Sistema Atual

O Copiloto IA atual (`/copilot`) e **somente consultivo**: le dados do banco, gera texto e responde perguntas. Ele **nao executa nenhuma acao real** no sistema. O gestor precisa sair do chat, navegar ate o modulo correto e fazer a acao manualmente.

## Onde a IA Executora se Encaixa Melhor

Apos analisar todos os modulos, o **melhor ponto de integracao e evoluir o proprio Copiloto** para se tornar um agente executor. Em vez de criar um modulo novo, o Copiloto ganha "superpoderes" via n8n.

### Por que o Copiloto?

1. Ja tem o contexto completo do negocio (financas, estoque, equipe, tarefas)
2. Ja tem interface de chat pronta (widget no dashboard + pagina full-screen)
3. O gestor ja conversa com ele naturalmente
4. A evolucao de "consultor" para "executor" e o proximo passo logico do roadmap

## Acoes Reais que a IA Executaria via n8n

| Acao | Exemplo de Comando Natural | Workflow n8n |
|------|---------------------------|--------------|
| Criar transacao financeira | "Registra despesa de R$450 com fornecedor X" | `create-transaction` |
| Criar pedido de compra | "Faz pedido pro fornecedor Y com os itens em falta" | `create-order` |
| Registrar tarefa na agenda | "Agenda reuniao com equipe amanha as 14h" | `create-task` |
| Enviar notificacao para equipe | "Avisa a equipe que amanha abre as 7h" | `send-notification` |
| Fechar caixa do dia | "Fecha o caixa de hoje" | `close-cash` |
| Pagar conta pendente | "Marca como paga a conta de luz" | `mark-paid` |

## Arquitetura

```text
Usuario (chat)
    |
    v
Frontend (Copilot)
    |
    v
Edge Function (management-ai)
    |
    v
Lovable AI (Gemini) com Tool Calling
    |
    v
Detecta intencao de ACAO
    |
    v
Edge Function chama webhook n8n
    |
    v
n8n executa a acao no Supabase
    |
    v
Retorna confirmacao pro chat
```

## Plano de Implementacao

### 1. Conectar n8n via MCP

O primeiro passo e conectar sua instancia n8n ao projeto. Voce precisara:
- Ter uma conta n8n (cloud ou self-hosted)
- Habilitar MCP access nas configuracoes do n8n
- Criar os workflows que executarao as acoes

### 2. Criar Workflows no n8n

Voce criara workflows no n8n para cada acao. Cada workflow:
- Recebe um webhook com os dados estruturados (ex: `{ action: "create_transaction", amount: 450, description: "Fornecedor X" }`)
- Executa a acao no banco via API do Supabase
- Retorna sucesso/erro

### 3. Evoluir a Edge Function `management-ai`

A edge function sera atualizada para usar **tool calling** (function calling) do Gemini. Em vez de gerar apenas texto, a IA decidira se precisa executar uma acao e retornara uma chamada de ferramenta estruturada.

Mudancas:
- Adicionar definicoes de `tools` (funcoes disponiveis) no payload da IA
- Quando a IA retornar um `tool_call`, a edge function despacha para o webhook n8n correspondente
- Apos executar, retorna a confirmacao formatada ao usuario

### 4. Atualizar o Frontend do Copiloto

Mudancas minimas:
- Adicionar indicador visual de "executando acao" (diferente do loading de texto)
- Mostrar card de confirmacao quando uma acao e executada (ex: "Transacao criada com sucesso")
- Botao de "desfazer" para acoes reversiveis

### 5. Seguranca

- O webhook n8n sera protegido com uma chave de API (secret)
- A edge function valida JWT do usuario antes de executar qualquer acao
- Cada acao gera um registro no `audit_logs`
- Acoes destrutivas (deletar, fechar caixa) pedem confirmacao explicita do usuario

## Proximos Passos

1. **Conectar n8n** - Voce precisa primeiro conectar sua instancia n8n ao Lovable
2. **Criar workflows base** - Comecaremos com 2-3 acoes simples (criar transacao, criar tarefa, enviar notificacao)
3. **Implementar tool calling** - Atualizar a edge function para suportar function calling
4. **Testar o fluxo completo** - Usuario fala > IA entende > n8n executa > confirmacao aparece

Quer prosseguir conectando o n8n primeiro?
