
# Reorganizar o Card de Perfil do Menu de Modulos

## Problema
O card com foto do usuario, nome, rank e seletor de unidade ocupa muito espaco vertical no Drawer de modulos, empurrando os icones de navegacao para baixo.

## Solucao

Remover o card grande (linhas 327-389 do AppLayout.tsx) e redistribuir as informacoes:

### 1. Seletor de Unidade -- mover para o cabecalho do Drawer
- Colocar o seletor de unidade compacto na mesma linha do handle/botao fechar (linha 310-325)
- Layout: `[Seletor de Unidade] --- [handle] --- [X]`
- O seletor sera um botao pequeno com o dot colorido + nome da unidade + chevron

### 2. Mini perfil -- linha compacta abaixo do handle
- Substituir o card grande por uma linha compacta (1 linha, ~40px de altura):
  - Avatar pequeno (32px) + nome + rank em texto + seta para perfil
  - Tudo inline, sem card/borda, apenas uma faixa sutil

### 3. Resultado
- Economia de ~80px de espaco vertical no Drawer
- Informacoes de perfil e unidade continuam acessiveis
- Mais modulos visiveis sem scroll

## Detalhes Tecnicos

**Arquivo:** `src/components/layout/AppLayout.tsx`

**Alteracoes:**

1. **Remover** o bloco "Profile Card" (linhas 327-389) -- o card com avatar grande, nome, rank, e o seletor de unidade embutido

2. **Atualizar o cabecalho do Drawer** (linhas 310-325) para incluir o seletor de unidade inline:
   - Lado esquerdo: botao do seletor de unidade (dot colorido + nome truncado + chevron)
   - Centro: handle bar
   - Lado direito: botao fechar (X)

3. **Adicionar mini perfil** logo abaixo do cabecalho:
   - Uma linha compacta com `RankedAvatar` (32px), nome truncado, rank/pontos, e botao de navegacao ao perfil
   - Padding reduzido (px-4 py-2)
   - Sem card background, apenas uma borda inferior sutil (`border-b border-border/10`)

4. **Manter** o dropdown de unidades com a mesma logica de abertura/fechamento e posicionamento absoluto, agora ancorado no cabecalho
