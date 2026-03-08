

## Plano: Separar Cardápio Digital (Delivery) e Cardápio Tablet (Mesa)

### Situação Atual

Hoje, `DigitalMenu.tsx` serve ambos os fluxos (delivery e mesa) na mesma página, diferenciando apenas pelo parâmetro `?mesa=X`. As rotas `/m/:unitId` e `/tablet/:unitId` apontam para o mesmo componente. Isso mistura dois fluxos com UX muito diferentes.

### Arquitetura Proposta

**Dois links, dois fluxos, dois componentes:**

```text
/m/:unitId          → Cardápio Digital (Delivery) — link público para redes sociais
/tablet/:unitId     → Cardápio Tablet (Mesa) — fica no tablet na mesa do restaurante
```

---

### Fluxo 1: Cardápio Digital (`/m/:unitId`) — Delivery

- **Público**: Cliente acessa via redes sociais, de casa
- **Experiência**: Layout mobile-first atual (landing, categorias, destaques, busca)
- **Checkout**: Pede nome, telefone, endereço, forma de pagamento
- **Source**: `delivery` no banco
- **Componente**: `DigitalMenu.tsx` (mantém o atual, remove lógica de mesa)

### Fluxo 2: Cardápio Tablet (`/tablet/:unitId`) — Mesa

- **Público**: Cliente sentado no restaurante, tablet na mesa
- **Experiência**: Layout otimizado para tablet (inspirado na referência Goomer enviada)
  - Sidebar fixa com categorias à esquerda
  - Área de produtos à direita com cards grandes
  - Header com logo, busca, indicador "MESA X", botão carrinho
  - Sem landing page — já abre direto no cardápio
- **Checkout**: No carrinho, pede apenas **número da mesa** e **nome do cliente** (pagamento presencial)
- **Source**: `mesa` no banco
- **Componente**: Novo `TabletDigitalMenu.tsx` (substitui o antigo `TabletMenu.tsx`)

---

### Mudanças Técnicas

| O que | Detalhe |
|-------|---------|
| **Novo componente** | `src/pages/TabletDigitalMenu.tsx` — layout tablet com sidebar de categorias, header com mesa/busca/carrinho, grid de produtos |
| **Novo componente** | `src/components/digital-menu/TabletMenuCart.tsx` — carrinho simplificado: só mesa + nome |
| **Editar `DigitalMenu.tsx`** | Remover toda lógica de `mesa`/`?mesa=X`. É sempre delivery. Remover campo "número da mesa" do `MenuCart` |
| **Editar `MenuCart.tsx`** | Remover branch de mesa — sempre exige nome, telefone, endereço |
| **Editar `App.tsx`** | `/m/:unitId` → `DigitalMenu`, `/tablet/:unitId` → `TabletDigitalMenu` |
| **Reutilizar** | `useDigitalMenu` hook, `MenuProductDetail`, `MenuSearch` — compartilhados entre os dois fluxos |

### Layout do Tablet (baseado na referência)

```text
┌──────────────────────────────────────────────────────┐
│  [Logo]   🔍 Buscar    MESA 29    [Carrinho]         │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Entradas │  ┌─────────────────────────────────────┐  │
│          │  │ [Foto]  Produto X        R$ 34,90   │  │
│ Lanches  │  │         Descrição...    [ADICIONAR] │  │
│          │  └─────────────────────────────────────┘  │
│ Bebidas  │  ┌─────────────────────────────────────┐  │
│          │  │ [Foto]  Produto Y        R$ 29,90   │  │
│ Sobrem.  │  │         Descrição...    [ADICIONAR] │  │
│          │  └─────────────────────────────────────┘  │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Checkout do Tablet

No carrinho, em vez de endereço/pagamento:
- Campo "Número da mesa" (numérico, grande)
- Campo "Seu nome" (para identificação)
- Botão "Enviar Pedido"
- Pedido cai em **Comandas** no painel unificado

