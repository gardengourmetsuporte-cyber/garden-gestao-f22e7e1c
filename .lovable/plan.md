

# Plano: Simplificar e Corrigir Sistema de Roleta

## Problemas Identificados

1. **GamificationPlay.tsx** ainda existe como página standalone mas não é mais usada nas rotas (removida dos imports mas arquivo persiste)
2. **SpinWheel.tsx** existe mas não é usado em lugar nenhum — o sistema usa `SlotMachine.tsx`
3. **RLS bloqueando**: `checkAlreadyPlayed` faz SELECT em `gamification_plays` mas a policy exige admin — anon users não conseguem verificar se já jogaram
4. **Roleta no cardápio digital (`/m/:unitId`)** já está integrada na tab "game" do `DigitalMenu.tsx` — isso está correto
5. **Admin da roleta** no `CardapioHub.tsx` tem link separado para `/m/:unitId?tab=game` — correto, mas o label "Link da roleta" confunde, deveria ser "Link do cardápio"
6. **PrizeSheet** não mostra % de chance real, só peso bruto — precisa mostrar a probabilidade calculada (peso/total)
7. **Falta visual de probabilidade**: no admin, ao configurar prêmios, o usuário não vê a chance real de cada prêmio sair

## Etapas

### 1. Corrigir RLS — permitir SELECT público em `gamification_plays`
- Adicionar policy de SELECT público (ou pelo menos filtrado por `order_id`) para que `checkAlreadyPlayed` funcione sem auth
- Isso é necessário para que clientes anônimos no cardápio digital possam validar antes de jogar

### 2. Limpar arquivos mortos
- Remover `src/pages/GamificationPlay.tsx` (não referenciado em rotas)
- Remover `src/components/gamification/SpinWheel.tsx` (não usado)

### 3. Melhorar PrizeSheet — mostrar % de chance real
- No formulário de criação/edição de prêmio, ao lado do campo "Probabilidade (peso)", mostrar a % calculada em tempo real baseada no total de pesos de todos os prêmios
- No card de cada prêmio na lista admin, mostrar `XX%` ao lado do peso

### 4. Melhorar lista de prêmios no CardapioHub
- Mostrar barra visual de probabilidade (progress bar colorida) em cada prêmio
- Mostrar % calculada (peso/total * 100) ao invés de apenas "Peso: X"

### 5. Ajustar link da roleta no admin
- Mudar label de "Link da roleta" para "Link do cardápio digital" já que a roleta é uma tab dentro do cardápio
- Remover card separado — o QR genérico na aba "Mesas" já serve

### 6. Garantir auto-start da roleta quando vem de `?tab=game`
- Já funciona via `initialTab` no `DigitalMenu.tsx` — verificar apenas que está correto

