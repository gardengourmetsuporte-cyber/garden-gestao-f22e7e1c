

## Plano: Transformar aba "Pedidos" em Central de Configurações

A aba "Pedidos" no bottom nav do Cardápio atualmente apenas espelha o cardápio. Vamos transformá-la em um hub de configurações organizado por solução (similar ao iFood), com seções colapsáveis.

### Estrutura da nova aba

```text
┌─────────────────────────────┐
│  ⚙️  Configurações          │
├─────────────────────────────┤
│  🛵 Solução Delivery    ▾   │
│    • Sobre (nome, descrição)│
│    • Delivery & Retirada    │
│    • Áreas e Taxas          │
│    • Formas de Pagamento    │
│    • Horários               │
├─────────────────────────────┤
│  📱 Solução em Tablet   ▾   │
│    • Integração PDV         │
│    • Mesas & QR Codes       │
│    • Chave Pix              │
├─────────────────────────────┤
│  📷 QR Code Balcão     ▾   │
│    • Link externo p/ cliente│
│    • QR Code gerado         │
│    • Configurações          │
│    (novo source: 'qrcode')  │
├─────────────────────────────┤
│  🎰 Gamificação        ▾   │
│    • Roleta / Prêmios       │
│  ♾️ Rodízio             ▾   │
│    • Configurações rodízio  │
└─────────────────────────────┘
```

### Alterações por arquivo

| Arquivo | O que muda |
|---|---|
| `src/pages/CardapioHub.tsx` | Detectar `?tab=pedidos` e renderizar novo componente `CardapioConfigHub` em vez do cardápio. Renomear o bottom tab de "Pedidos" para "Config" |
| `src/components/layout/BottomTabBar.tsx` | Alterar label/icon do tab "pedidos" de `ShoppingBag`/"Pedidos" para `Settings`/"Config" |
| `src/components/cardapio/CardapioConfigHub.tsx` | **Novo arquivo** — Hub de configurações com seções colapsáveis (Accordion). Reutiliza os componentes existentes do `CardapioSettings` (PDV, Mesas, Delivery, Gamificação, Rodízio) reorganizados por "Solução". Adiciona seção "QR Code Balcão" com link externo para o cliente escanear e pedir pelo celular (`/m/:unitId?source=qrcode`). |

### Seção "QR Code Balcão" (novo canal)
- Gera QR code apontando para `/m/:unitId?source=qrcode`
- O cliente escaneia no celular, faz o pedido pelo cardápio digital
- Pedido entra no sistema com `source: 'qrcode'` (diferenciando de mesa/delivery/balcão)
- O QR é genérico (sem mesa), cliente informa nome no checkout

### O que é reutilizado
Todo o conteúdo de configuração já existe em `CardapioSettings.tsx`. O novo componente reorganiza as mesmas funcionalidades em seções por "Solução" usando Accordion, sem duplicar código — importando sub-componentes ou extraindo seções.

