

## Plano: Padronizar Hub de Configurações com Links Integrados por Solução

### Situação atual
- Os **links** (Cardápio Digital, QR Code Balcão, Tablet, KDS) ficam numa seção separada "Links & Acessos" no topo
- As **seções de configuração** ficam abaixo em accordions separados
- Não há relação visual entre o link e sua solução correspondente

### O que muda

Remover a seção "Links & Acessos" separada e **integrar cada link dentro da sua respectiva solução**. Cada accordion passa a ter:

```text
┌─────────────────────────────────────────────┐
│ 🔵  Solução KDS                           ▼ │
│     Pistas e setores para a cozinha         │
├─────────────────────────────────────────────┤
│  ┌── Link de Acesso ─────────────────────┐  │
│  │ 🔗 KDS - Cozinha    [QR] [📋] [↗]    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌── Configurações ─────────────────────┐  │
│  │  (KDSStationsManager)                │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Mapeamento link → solução

| Solução | Links integrados |
|---------|-----------------|
| **Solução KDS** | KDS - Cozinha (`/kds/:id`) |
| **Solução Delivery** | Cardápio Digital (`/m/:id`) |
| **Solução Tablet** | Cardápio Tablet (`/tablet/:id`) |
| **Solução QR Code** | QR Code Balcão (`/m/:id?source=qrcode`) |
| **Rodízio** | Nenhum link |

### Padronização visual dos cards

Cada accordion terá subseções internas com labels (`text-xs uppercase text-muted-foreground`):
- **Acesso Rápido** — card do link com botões QR/Copiar/Abrir
- **Configurações** — conteúdo atual (KDSStationsManager, CardapioSettings, etc.)

### Alterações técnicas

**Arquivo: `src/components/cardapio/CardapioConfigHub.tsx`**

1. Remover o array `LINKS_DATA` separado
2. Adicionar campo `links` ao array `SECTIONS` com os links pertencentes a cada solução
3. Remover a seção "Links & Acessos" do JSX
4. Dentro de cada `AccordionContent`, renderizar primeiro a subseção "Acesso Rápido" com os links da solução (mesmo visual compacto atual com botões QR/Copiar/Abrir), depois a subseção de configurações
5. Manter o modal de QR Code intacto
6. Componente auxiliar `SolutionLinkCard` extraído para consistência

