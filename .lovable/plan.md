

## Plano: Enviar pedido no Balcão + Opção "Comer aqui / Levar" no Tablet

### Problema
1. No PDV Balcão, só tem "Cobrar" — mas às vezes o cliente quer apenas lançar o pedido na cozinha e pagar depois (retirada).
2. No Tablet, não há opção para o cliente escolher entre "Comer aqui" e "Levar".

### Mudanças

**1. PDV — Balcão: adicionar botão "Enviar" ao lado de "Cobrar"**
- No modo `balcao`, exibir dois botões primários:
  - **Enviar** (outline/secondary) — envia pedido para cozinha via `sendOrder()` sem cobrar
  - **Cobrar** (primary) — abre pagamento como hoje
- Ao enviar sem cobrar, o pedido vai como `tablet_order` com source `balcao`, aparece na Central de Pedidos/KDS

**2. Tablet — Opção "Comer aqui" / "Levar"**
- No `TabletMenu.tsx`, antes do botão "Finalizar Pedido" no carrinho, adicionar um seletor com dois chips:
  - 🍽️ **Comer aqui** (padrão)
  - 🛍️ **Levar**
- Salvar a escolha no campo `notes` do pedido (prefixo `[LEVAR]` ou `[COMER AQUI]`) ou em um campo dedicado
- O KDS/Central de Pedidos mostrará essa informação

### Arquivos a Editar
| Arquivo | Ação |
|---|---|
| `src/pages/PDV.tsx` | Adicionar botão "Enviar" no modo balcão |
| `src/pages/TabletMenu.tsx` | Adicionar seletor "Comer aqui / Levar" no carrinho |
| `src/hooks/usePOS.ts` | Permitir `sendOrder()` funcionar com source `balcao` (remover restrição de mesa obrigatória) |

