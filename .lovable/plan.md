

# Plano: Redesign Completo do Cardápio Digital Unificado

## Problema Atual
Os módulos estão fragmentados em 3 fluxos separados:
- `/m/:unitId` → Cardápio digital (criado mas básico/esqueleto)
- `/tablet/:unitId` → Seleção de mesa + cardápio tablet (fluxo antigo)  
- `/gamification/:unitId` → Roleta standalone (fluxo antigo)

O design está genérico e não segue o padrão visual Goomer que você mostrou nos screenshots.

## O que será feito

### 1. Redesign completo do `MenuLanding.tsx`
Inspirado nos screenshots do Goomer:
- Banner/cover image do estabelecimento (full-width, altura generosa ~180px)
- Logo sobrepondo o banner (posição inferior, borda branca)
- Nome do restaurante em destaque, tipo de cozinha, endereço
- Badge "Aberto/Fechado" com horários visíveis
- Info de entrega/tempo estimado (se configurado)
- Botão de compartilhar/info

### 2. Redesign do `MenuProductList.tsx`
Estilo Goomer:
- Chips de categoria horizontais com ícone + texto (estilo pill arredondado)
- Cards de produto com imagem à direita (layout horizontal, não vertical)
- Nome, descrição truncada (2 linhas), preço alinhado à esquerda
- Tag "Mais vendido" / destaque visual para `is_highlighted`
- Separadores visuais entre grupos com título + descrição

### 3. Redesign do `MenuProductDetail.tsx`
- Imagem full-width no topo do sheet
- Layout de opcionais com radio buttons para seleção única, checkboxes para múltipla
- Badges "Obrigatório" em vermelho
- Contador de quantidade com design arredondado
- Botão "Adicionar R$ XX,XX" em verde/primary no rodapé fixo
- Campo de observações colapsável

### 4. Redesign do `MenuBottomNav.tsx`
- 4 tabs com design glassmorphism: Início | Cardápio | Pedido | Roleta
- Tab "Início" mostra o landing/info do restaurante
- Badge de contagem no ícone do carrinho (estilo WhatsApp)
- Indicador ativo com pílula/barra inferior animada

### 5. Redesign do `MenuCart.tsx`
- Header com contagem de itens
- Cards de item com imagem thumbnail, controles +/- inline
- Seção de "Resumo do pedido" com subtotal, taxas
- Input de mesa com design grande e claro
- Botão "Finalizar Pedido" fixo no bottom, verde, com valor total
- Tela de sucesso com animação de check + número do pedido

### 6. Redesign do `MenuSearch.tsx`
- Barra de busca com ícone, placeholder contextual
- Sugestões populares quando vazio (produtos destacados)
- Resultados com mesmo card style do cardápio

### 7. Unificar rotas — eliminar duplicatas
- `/m/:unitId` → Experiência unificada (cardápio + roleta + pedido)
- `/tablet/:unitId` → Redirecionar para `/m/:unitId?mesa=auto` (mantém compatibilidade)
- `/gamification/:unitId` → Redirecionar para `/m/:unitId?tab=game`
- Remover `TabletSelect.tsx` e `TabletMenu.tsx` como páginas standalone (manter redirect)

### 8. QR Code no TabletAdmin
- Seção dedicada na aba "Mesas" com gerador de QR Code
- QR por mesa: `/m/:unitId?mesa=N`
- QR genérico (sem mesa) para balcão/delivery
- Botão de copiar link + preview do QR

### Detalhes Técnicos
- Todos os redesigns acontecem nos arquivos existentes em `src/components/digital-menu/`
- `DigitalMenu.tsx` recebe tab "home" como default (mostra landing)
- Usar `qrcode.react` (já instalado) para gerar QR codes no admin
- CSS: glassmorphism, gradientes suaves, sombras tier-1, animações spring
- Mobile-first, max-width 480px centralizado

