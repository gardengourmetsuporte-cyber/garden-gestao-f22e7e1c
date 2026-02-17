

# Landing Page Profissional com Planos e Imagens

## Objetivo
Transformar a landing page atual de "rascunho textual" em uma pagina de vendas profissional e completa, com mockups visuais do sistema, secao de planos com precos, e visual premium de verdade.

## O que muda

### 1. Hero Section reformulado
- Adicionar um **mockup do dashboard** no hero (imagem gerada via IA mostrando a interface do sistema em um notebook/celular)
- Layout split: texto a esquerda, imagem a direita (desktop) / empilhado (mobile)
- Badge animado "Novo" ou "IA integrada"
- Numeros de impacto abaixo do CTA (ex: "500+ empresas", "10 modulos", "IA inclusa")

### 2. Secao de Screenshots do Sistema (nova)
- Criar componente `ScreenshotsSection.tsx`
- Tabs ou carousel mostrando telas reais do sistema: Dashboard, Financeiro, Estoque, Checklists
- Cada tab com titulo + descricao + screenshot
- Usar screenshots capturados do proprio sistema

### 3. Secao de Planos e Precos (nova)
- Criar componente `PricingSection.tsx`
- 3 planos:
  - **Gratis**: Dashboard, Agenda, 1 Checklist, Chat interno (R$ 0/mes)
  - **Pro**: Tudo do Gratis + Financeiro, Estoque, Equipe, Receitas, Gamificacao (R$ 97/mes)
  - **Business**: Tudo do Pro + IA Copiloto, WhatsApp Bot, Marketing, Pedidos Online, Suporte prioritario (R$ 197/mes)
- Card do plano Pro destacado como "Mais popular"
- Botao CTA em cada plano levando para `/auth` (cadastro)
- Toggle mensal/anual com desconto de 20% no anual
- Lista de features com checkmarks verdes

### 4. Secao de FAQ (nova)
- Criar componente `FAQSection.tsx`
- Accordion com perguntas frequentes:
  - "Posso testar gratis?"
  - "Como funciona o plano gratis?"
  - "Preciso de cartao de credito?"
  - "Posso mudar de plano depois?"
  - "Meus dados estao seguros?"

### 5. Melhorias visuais gerais
- **Navbar**: Adicionar link "Planos" apontando para `#planos`
- **Hero**: Adicionar contadores animados (empresas, modulos)
- **Problem/Solution/Benefits**: Melhorar com ilustracoes via icones maiores e mais espacamento
- **CTA Final**: Referenciar o plano gratis ("Comece gratis, upgrade quando quiser")
- **Footer**: Adicionar links para Termos, Privacidade, Planos

### 6. Geracao de imagens do sistema
- Usar a IA de geracao de imagem para criar um mockup profissional mostrando o dashboard do Garden em um laptop/celular
- A imagem sera salva no storage e referenciada no Hero

## Estrutura final da pagina (ordem das secoes)

1. Navbar (com link "Planos")
2. Hero (com mockup visual)
3. Logos/numeros de confianca
4. O Problema
5. A Solucao
6. Screenshots do Sistema (nova)
7. Beneficios
8. Como Funciona
9. Planos e Precos (nova)
10. Diferenciais
11. FAQ (nova)
12. Confianca/LGPD
13. CTA Final
14. Footer

## Secao Tecnica

### Arquivos a criar
- `src/components/landing/PricingSection.tsx` -- Cards de planos com toggle mensal/anual
- `src/components/landing/ScreenshotsSection.tsx` -- Tabs com screenshots do sistema
- `src/components/landing/FAQSection.tsx` -- Accordion de perguntas frequentes

### Arquivos a editar
- `src/components/landing/HeroSection.tsx` -- Layout split com mockup + contadores
- `src/components/landing/LandingNavbar.tsx` -- Adicionar link "Planos"
- `src/components/landing/CTASection.tsx` -- Referenciar plano gratis
- `src/components/landing/FooterSection.tsx` -- Mais links
- `src/pages/Landing.tsx` -- Adicionar novas secoes na ordem correta

### Planos detalhados

**Gratis (R$ 0/mes)**
- Dashboard basico
- Agenda
- 1 Checklist
- Chat interno
- Ate 3 usuarios

**Pro (R$ 97/mes) -- DESTAQUE**
- Tudo do Gratis
- Financeiro completo
- Estoque inteligente
- Gestao de equipe
- Fichas tecnicas
- Gamificacao e ranking
- Fechamento de caixa
- Ate 15 usuarios

**Business (R$ 197/mes)**
- Tudo do Pro
- IA Copiloto
- WhatsApp Bot
- Marketing
- Pedidos online (tablet)
- Cardapio digital
- Financas pessoais
- Usuarios ilimitados
- Suporte prioritario

### Sobre pagamentos
Neste primeiro momento os planos serao informativos (o botao leva para cadastro em `/auth`). A integracao com pagamento real (Stripe) pode ser feita em uma etapa seguinte apos validar o interesse.

### Banco de dados
Nenhuma migracao necessaria nesta etapa.

