

# Slot Machine -- Substituir Roleta por Caca-Niqueis

## O que muda

Trocar o componente `SpinWheel` (roleta circular) por um **SlotMachine** no estilo caca-niqueis com 3 colunas de rolos girando verticalmente, igual a imagem de referencia.

A logica de negocio (hook `useGamification`, banco, validacoes, resultado) **nao muda** -- apenas o componente visual e substituido.

---

## Mecanica do Slot Machine

### Visual
- 3 colunas (reels) lado a lado, cada uma mostrando 3 linhas visiveis de simbolos (emojis dos premios)
- Moldura estilizada com gradiente dourado/vermelho inspirado no visual da referencia
- Linha central destacada (payline) onde o resultado aparece
- Botao grande verde centralizado abaixo para "GIRAR"

### Animacao
1. Ao clicar, os 3 rolos comecam a girar (translateY animado em loop)
2. Cada rolo para sequencialmente com delay (rolo 1 para em ~1.5s, rolo 2 em ~2.5s, rolo 3 em ~3.5s)
3. O resultado final e pre-calculado via `weightedRandom` antes do giro comecar
4. Os rolos param nos simbolos corretos com efeito de desaceleracao (ease-out)

### Logica de Resultado
- O premio e sorteado normalmente via `weightedRandom(prizes)`
- Se o premio **ganhou** (type != 'empty'): os 3 rolos param no **mesmo emoji** do premio (3 iguais = vitoria visual clara)
- Se **nao ganhou** (type == 'empty'): os 3 rolos param em emojis **diferentes** (mistura visual = "quase la")

---

## Arquivos Afetados

### Novo
- `src/components/gamification/SlotMachine.tsx` -- componente principal com 3 rolos animados

### Editados
- `src/pages/GamificationPlay.tsx` -- trocar `<SpinWheel>` por `<SlotMachine>`, atualizar texto "Toque para girar" para "Toque GIRAR para jogar"
- `src/components/gamification/SpinWheel.tsx` -- mantido no projeto mas nao mais usado (pode ser removido)

### Sem alteracao
- `useGamification.ts` -- mesma interface, mesmo `weightedRandom`
- `PrizeResult.tsx` -- mesma tela de resultado
- Banco de dados -- nenhuma mudanca
- Painel admin -- nenhuma mudanca

---

## Detalhes Tecnicos

### Estrutura do SlotMachine
```text
+----------------------------------+
|   [Moldura dourada/vermelha]     |
|  +--------+--------+--------+   |
|  | Rolo 1 | Rolo 2 | Rolo 3 |   |
|  |  icon   |  icon   |  icon  |  |  <- linha superior
|  |  ICON   |  ICON   |  ICON  |  |  <- PAYLINE (destacada)
|  |  icon   |  icon   |  icon  |  |  <- linha inferior
|  +--------+--------+--------+   |
|                                  |
|         [ GIRAR 🎰 ]            |
+----------------------------------+
```

### Animacao dos Rolos
- Cada rolo e um container com `overflow: hidden` contendo uma strip vertical de emojis
- A strip e composta por todos os emojis dos premios repetidos varias vezes
- O giro e feito via `translateY` animado com CSS transition
- O offset final e calculado para que o emoji do premio sorteado fique na posicao central (payline)
- Desaceleracao com `cubic-bezier(0.15, 0.80, 0.20, 1.00)`

### Estilo Visual
- Fundo: gradiente vermelho escuro com bordas douradas (inspirado na referencia)
- Payline: linha horizontal com glow dourado
- Separadores entre rolos com borda dourada sutil
- Botao de girar: grande, verde, circular com icone de play
- Reflexo/brilho sutil na parte inferior dos rolos

### Props (mesma interface do SpinWheel)
```text
prizes: GamificationPrize[]
onResult: (prize: GamificationPrize) => void
disabled?: boolean
```

---

## Resultado Esperado

Um jogo de caca-niqueis visualmente rico e animado, com a mesma logica de sorteio por pesos e as mesmas regras de negocio, mas com uma experiencia muito mais envolvente e premium para o cliente no tablet.
