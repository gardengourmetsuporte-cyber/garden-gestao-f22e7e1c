

# Landing Page Comercial - Garden Gestao

## Resumo

Criar uma landing page profissional de venda para o Garden, acessivel em `/landing`. A pagina sera publica (sem autenticacao), com visual **light mode** premium inspirado em Mobills/Stripe, contrastando com o dark mode do app interno.

## Estrutura da Pagina

### Secoes (scroll unico)
1. **Navbar** -- Logo + links de ancora + CTA "Entrar"
2. **Hero** -- Headline forte, subheadline, CTA principal, mockup ilustrativo
3. **O Problema** -- 3 pain points com icones
4. **A Solucao** -- Apresentacao do Garden como centralizador com IA
5. **Beneficios** -- 6 cards com icone + titulo + texto
6. **Como Funciona** -- 4 steps numerados
7. **Diferenciais** -- Grid comparativo
8. **Confianca** -- LGPD, seguranca, profissionalismo
9. **CTA Final** -- Reforco + botao grande
10. **Footer** -- Links, copyright

## Decisoes de Design

- **Light mode exclusivo** para a landing (fundo branco/cinza claro) -- diferencia do app dark
- **Cor primaria**: azul do sistema (`hsl(217 91% 60%)`) como accent
- **Tipografia**: Inter (ja carregada), titulos grandes (48px hero, 36px secoes)
- **Espacamento**: Muito white space, padding generoso (py-20 a py-28)
- **Mobile-first**: Stack vertical em mobile, grids em desktop
- **Scroll suave**: `scroll-behavior: smooth` no container
- **Sem dependencias novas**: Usa apenas Tailwind, AppIcon, e componentes existentes

## Foco na Proposta de Valor

A mensagem central e: **"Um unico sistema para quem nao tem orcamento para varios"**. Voltado para pequenos e medios empresarios que precisam centralizar operacao sem pagar por 5 ferramentas diferentes.

## Secao Tecnica

### Arquivos a Criar
- `src/pages/Landing.tsx` -- Pagina completa com todas as secoes
- `src/components/landing/LandingNavbar.tsx` -- Navbar fixa com transparencia
- `src/components/landing/HeroSection.tsx` -- Hero com headline + CTA
- `src/components/landing/ProblemSection.tsx` -- 3 pain points
- `src/components/landing/SolutionSection.tsx` -- Apresentacao da solucao
- `src/components/landing/BenefitsSection.tsx` -- 6 cards de beneficios
- `src/components/landing/HowItWorksSection.tsx` -- 4 steps
- `src/components/landing/DifferentialsSection.tsx` -- Grid de diferenciais
- `src/components/landing/TrustSection.tsx` -- Confianca e LGPD
- `src/components/landing/CTASection.tsx` -- CTA final
- `src/components/landing/FooterSection.tsx` -- Footer

### Arquivos a Editar
- `src/App.tsx` -- Adicionar rota publica `/landing`

### Estilo Visual

Todas as secoes usam classes Tailwind inline (sem CSS custom novo). Exemplo de paleta light:

```
Fundo: bg-white / bg-slate-50 (secoes alternadas)
Texto: text-slate-900 (titulos), text-slate-600 (corpo)
Accent: bg-blue-600 / text-blue-600 (CTAs e destaques)
Cards: bg-white border border-slate-200 shadow-sm
```

### Conteudo das Secoes

**Hero:**
- Headline: "Toda a gestao do seu negocio em um so lugar"
- Sub: "Financeiro, estoque, equipe, checklists e IA -- tudo integrado para pequenos e medios empresarios que precisam de controle sem complexidade."
- CTA: "Comece agora" (link para /auth)

**Problema:**
- "Planilhas espalhadas, sem visao real do negocio"
- "Pagar por 5 sistemas diferentes que nao conversam"
- "Equipe desengajada sem acompanhamento"

**Beneficios (6 cards):**
- Gestao financeira integrada
- Controle de equipe e desempenho
- Gamificacao e ranking
- Copiloto com IA
- Estoque inteligente
- Checklists e operacao

**Como Funciona:**
1. Cadastre sua empresa
2. Configure seus modulos
3. Acompanhe tudo em tempo real
4. Use a IA para decidir melhor

**Diferenciais:**
- IA integrada ao dia a dia
- Gamificacao real
- Mobile-first
- Preco justo para PMEs

### Banco de Dados
Nenhuma migracao necessaria.

