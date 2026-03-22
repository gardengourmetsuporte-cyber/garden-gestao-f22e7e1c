

# Correção do ComandaScanner — Manual e Fluxo Pós-Scan

## Problemas Identificados

1. **"Digitar manualmente" bloqueado**: O botão fica atrás dos elementos DOM criados pelo `html5-qrcode` (a biblioteca cria overlays internos que cobrem o botão). Precisa de `z-10` e `relative` para garantir que fique clicável.

2. **Tela preta após scan/manual**: Após escanear ou digitar o número da comanda, o `handleSend()` é chamado mas se falhar (erro de rede, RLS, timeout), o scanner fecha e o usuário fica preso — sem mensagem de sucesso nem de erro visível.

3. **Layout lado-a-lado no desktop/mobile**: O painel de instruções (`w-[45%]`) ocupa quase metade da tela e não faz sentido em telas pequenas. Precisa ser responsivo.

## Correções

### 1. `ComandaScanner.tsx` — Layout e z-index
- Adicionar `z-10` ao botão "Digitar manualmente" para ficar acima do scanner
- Esconder o painel de instruções (direito) em telas menores que `lg` — usar `hidden lg:flex`
- No modo manual, centralizar o formulário ocupando toda a largura disponível

### 2. `TabletMenuCart.tsx` — Fluxo pós-scan resiliente
- Envolver o `handleSend(num)` no `onScan` com try/catch para que se falhar, mostre toast de erro e mantenha o comanda number (não perca o estado)
- Se o pedido falhar, não fechar o scanner imediatamente — manter o número e permitir re-tentativa
- Garantir que o `setSending(false)` sempre execute no finally (já está OK)

### 3. `TabletMenu.tsx` — Mesmo ajuste
- No `onScan`, após setar o `comandaNumber`, disparar o submit do pedido com tratamento de erro

## Arquivos a editar
1. **`src/components/digital-menu/ComandaScanner.tsx`** — z-index no botão, layout responsivo
2. **`src/components/digital-menu/TabletMenuCart.tsx`** — try/catch no onScan handler

