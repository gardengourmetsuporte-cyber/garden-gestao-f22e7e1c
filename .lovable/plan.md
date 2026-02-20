

# Memoria de Preferencias do Copiloto

## Status: ✅ IMPLEMENTADO

## O que foi feito

O Copiloto agora aprende atalhos e mapeamentos personalizados do usuario. Por exemplo, quando o gestor diz "luz", o sistema entende automaticamente como "conta de energia eletrica, categoria Energia".

## Implementacao Concluida

### 1. Tabela `copilot_preferences` ✅
- Campos: id, user_id, unit_id, key, value, category, created_at, updated_at
- RLS: usuarios gerenciam apenas suas proprias preferencias
- Indice unico em (user_id, key) para evitar duplicatas

### 2. Tool `save_preference` na edge function ✅
- Nova tool no array TOOLS do management-ai
- Funcao `executeSavePreference` com upsert na tabela
- O modelo chama automaticamente quando detecta definicao de atalho

### 3. Preferencias carregadas no contexto da IA ✅
- Busca preferencias do usuario antes de montar o system prompt
- Injeta como bloco: `PREFERENCIAS DO USUARIO: 'luz' = 'conta de energia...'`
- Modelo usa preferencias para interpretar comandos ambiguos

### 4. Frontend (hook) atualizado ✅
- fetchFullContext busca preferencias do Supabase
- Envia no campo context.preferences para a edge function

## Fluxo:
1. Usuario diz: "quando eu falar luz, entenda como conta de energia"
2. Modelo detecta intencao e chama save_preference
3. Funcao faz upsert na tabela
4. Nas proximas mensagens, preferencias sao carregadas no prompt
5. Usuario diz: "registra a luz desse mes, R$280"
6. Modelo le preferencia e cria transacao com categoria correta
