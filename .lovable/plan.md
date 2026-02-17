

# Redesign Completo da Landing Page - Nivel Premium

## Problemas Identificados

1. **Identidade visual desconectada**: A landing usa light mode generico (branco/azul claro) enquanto o app real usa Dark Command Center com neon cyan -- parecem produtos diferentes
2. **Imagem do Hero e falsa**: Mockup gerado por IA, nao e uma foto real do sistema
3. **Secao de Screenshots vazia**: Mostra apenas icones placeholder em vez de telas reais
4. **Planos sem fluxo de compra**: Botoes levam direto para /auth sem nenhuma etapa de checkout ou selecao de plano
5. **Falta de prova social**: Sem depoimentos, sem logos de clientes, sem numeros reais
6. **Navbar sem menu mobile**: Links de navegacao somem no celular
7. **Secoes repetitivas**: Problema, Solucao e Beneficios se sobrepoe em conteudo

## Solucao

### 1. Identidade Visual Alinhada ao App

Migrar a landing page para o estilo dark premium do app, usando o mesmo design system:
- Fundo escuro (`bg-[hsl(222,70%,4%)]`) com gradientes sutis
- Cards com backdrop-blur e bordas cyan neon
- Tipografia bold com glow effects nos destaques
- Manter contraste alto para legibilidade

### 2. Hero com Screenshot Real do Sistema

- Capturar screenshot real do dashboard do app (via browser tool)
- Exibir dentro de um frame de laptop/celular estilizado com CSS (sem imagem de computador)
- Adicionar glow effect atras da imagem para efeito premium
- Animacao sutil de entrada (fade + slide up)

### 3. Secao de Modulos com Screenshots Reais

- Capturar screenshots reais das telas: Dashboard, Financeiro, Estoque, Equipe
- Substituir os placeholders por imagens reais do sistema
- Animacao de transicao ao trocar de tab
- Frame com borda neon cyan

### 4. Fluxo de Compra nos Planos

- Ao clicar "Assinar Pro" ou "Assinar Business", abrir modal/dialog com:
  - Resumo do plano selecionado
  - Opcao mensal/anual com preco
  - Formulario de dados basicos (nome, email)
  - Botao "Ir para pagamento" que redireciona para /auth com query param do plano (`/auth?plan=pro`)
- Auth page reconhece o parametro e exibe mensagem contextual ("Cadastre-se para ativar o plano Pro")
- Nota: pagamento real via Stripe sera integrado em etapa futura; por ora o fluxo captura o lead com o plano escolhido

### 5. Melhorias de Qualidade Premium

- **Navbar mobile**: Adicionar hamburger menu com drawer para links
- **Animacoes de scroll**: Elementos aparecem com fade-in conforme scroll (IntersectionObserver)
- **Secao de depoimentos**: 3 cards com depoimentos ficticios mas realistas de empresarios
- **Comparativo visual**: Tabela "Antes vs Depois" mostrando caos de planilhas vs Garden organizado
- **Video placeholder**: Secao com botao de play para futuro video demo
- **Gradiente hero**: Background com mesh gradient animado (estilo Linear.app)
- **Footer completo**: Links organizados em colunas, redes sociais, selo de seguranca

### 6. Secoes Reestruturadas (ordem final)

1. Navbar (dark, blur, hamburger mobile)
2. Hero (dark, screenshot real, CTA duplo, contadores)
3. Logos de confianca (band de logos ou numeros)
4. O Problema (visual dark com icones glow)
5. A Solucao (comparativo antes/depois)
6. Modulos do Sistema (tabs com screenshots reais)
7. Beneficios (cards dark com icone glow)
8. Como Funciona (timeline vertical com steps)
9. Depoimentos (cards com avatar + texto)
10. Planos e Precos (cards dark, toggle, modal de compra)
11. FAQ (accordion dark)
12. CTA Final (gradiente cyan, botao glow)
13. Footer (dark, colunas, links)

## Secao Tecnica

### Componentes novos
- `src/components/landing/TestimonialsSection.tsx` -- Depoimentos ficticios
- `src/components/landing/PlanCheckoutDialog.tsx` -- Modal de selecao de plano pre-checkout

### Componentes a reescrever (estilo dark + melhorias)
- `src/components/landing/LandingNavbar.tsx` -- Dark + hamburger mobile
- `src/components/landing/HeroSection.tsx` -- Dark, screenshot real, mesh gradient
- `src/components/landing/ProblemSection.tsx` -- Dark, icones glow
- `src/components/landing/SolutionSection.tsx` -- Dark, comparativo
- `src/components/landing/ScreenshotsSection.tsx` -- Screenshots reais com frame neon
- `src/components/landing/BenefitsSection.tsx` -- Cards dark glow
- `src/components/landing/HowItWorksSection.tsx` -- Timeline dark
- `src/components/landing/PricingSection.tsx` -- Cards dark + modal checkout
- `src/components/landing/DifferentialsSection.tsx` -- Dark
- `src/components/landing/FAQSection.tsx` -- Accordion dark
- `src/components/landing/TrustSection.tsx` -- Dark
- `src/components/landing/CTASection.tsx` -- Gradiente neon
- `src/components/landing/FooterSection.tsx` -- Dark completo
- `src/pages/Landing.tsx` -- Wrapper dark + scroll animations

### Arquivos a editar
- `src/pages/Auth.tsx` -- Ler query param `?plan=` e exibir contexto

### Screenshots a capturar
- Dashboard principal (via browser tool, navegando para / logado)
- Tela financeira
- Tela de estoque
- Tela de equipe

### Banco de dados
Nenhuma migracao necessaria nesta etapa.

### Dependencias
Nenhuma nova dependencia necessaria. Scroll animations serao implementadas com IntersectionObserver nativo.

