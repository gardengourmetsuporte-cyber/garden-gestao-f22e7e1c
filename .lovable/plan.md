

## Plano: Mover seletor de modo de venda para uma tela intermediária

### O que muda

Atualmente, o seletor de modo (Balcão/Mesa/Delivery) e seus campos ficam visíveis o tempo todo no carrinho. A proposta é:

1. **Remover** o seletor de modo e campos contextuais (nome, mesa, endereço) da área do carrinho
2. **Criar um Sheet intermediário** ("SaleSourceSheet") que aparece quando o operador clica em **"Enviar"** ou **"Cobrar"**
3. Nesse sheet, o operador escolhe o modo e preenche os campos necessários, depois confirma para prosseguir (enviar pedido ou abrir pagamento)

### Fluxo novo

```text
Carrinho com itens → Clica "Enviar" ou "Cobrar"
                         ↓
              ┌─────────────────────────┐
              │   Modo da Venda         │
              │  [Balcão] [Mesa] [Delivery] │
              │                         │
              │  (campos contextuais)   │
              │  Nome, Mesa, Endereço...│
              │                         │
              │  [Continuar]            │
              └─────────────────────────┘
                         ↓
         Enviar pedido / Abrir PaymentSheet
```

### Implementação técnica

**1. Novo componente `src/components/pdv/SaleSourceSheet.tsx`**
- Sheet com os 3 botões de modo (Balcão/Mesa/Delivery)
- Campos contextuais condicionais (mesmo conteúdo que existe hoje)
- Botão "Continuar" que chama `onConfirm(mode, data)`
- Props: `open`, `onOpenChange`, `pos` (ou campos individuais), `onConfirm`

**2. Editar `src/pages/PDV.tsx`**
- Remover linhas 367-414 (seletor de modo + campos contextuais) da área do carrinho
- Adicionar estado `saleSourceOpen` e `saleSourceAction` ('send' | 'charge')
- Botão "Enviar" e "Cobrar" abrem o SaleSourceSheet em vez de agir diretamente
- No `onConfirm` do sheet: seta o saleSource/campos no `pos`, depois executa a ação (sendOrder ou abre PaymentSheet)

**3. Sem mudanças no hook `usePOS.ts`** — continua usando os mesmos estados, apenas são preenchidos no momento do sheet

